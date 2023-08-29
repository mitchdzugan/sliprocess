const _ = require('lodash');
const fs = require('fs');
const fsa = require('fs/promises');
const { SlippiGame } = require("@slippi/slippi-js");
const GALINTS = require('./GALINTS.json');
const DB = require("./DB.js");

const root = '/mnt/d/Slippi/';
const proot = '/mnt/d/__yo5h1_pr0n__/preview/';

const CLIFF_CATCH = 252;
const AI_LANDING = 42;
const procGame = (gameId) => {
    const game = new SlippiGame(root + gameId + '.slp');
    const frames = game.getFrames();
    const settings = game.getSettings();
    if (!settings) { return []; }
    const meInd = settings.players[0].characterId === 17 ? 0 : 1;
    if (settings.players[meInd].characterId !== 17) { return []; }
    const me = settings.players[meInd].port - 1;
    const frameIds = _.map(Object.keys(frames), (i) => parseInt(i));
    const minId = _.min(frameIds);
    const maxId = _.max(frameIds);
    const results = [];
    for (let frameId = minId + 1; frameId < maxId; frameId++) {
        const data = frames[frameId].players[me];
        const prev = frames[frameId - 1].players[me];
        const isCatch = data.pre.actionStateId === CLIFF_CATCH && prev.pre.actionStateId !== CLIFF_CATCH;
        if (isCatch) {
            for (let i = frameId + 1; i <= frameId + 32 && i < maxId; i++) {
                if (frames[i].players[me].pre.actionStateId === AI_LANDING) {
                    const galint = 33 - (i - frameId);
                    results.push({ frameId, galint })
                    break;
                }
            }
        }
    };
    return results;
};

// procGame_('Game_20230724T184609');
GALINTS.nextId;
GALINTS.data;
GALINTS.latest;

const proc = () => {
    const games = _.map(
        _.filter(
            _.sortBy(fs.readdirSync(proot), i => i), f => f.endsWith('.mp4')
        ),
        (fn) => fn.replace(".mp4", "")
    );

    for (const game of games) {
        if (game <= GALINTS.earliest || game.startsWith("Game_2024")) { continue; }
        console.log(game);
        const results = procGame(game);
        console.log(results);
        for (const result of results) {
            GALINTS.data[GALINTS.nextId] = { game, ...result };
            GALINTS.nextId += 1;
        }
        GALINTS.earliest = game;
        fs.writeFileSync('./GALINTS.json', JSON.stringify(GALINTS));
    }
};

const main = async () => {
    const files = await fsa.readdir("/mnt/d/Slippi");
    const slpFiles = files.filter(s => s.endsWith(".slp"));
    const parsed = await DB
        .select("Game.*").from("Game")
        .where({ parseVersion: 1 })
        .orWhereNotNull("skipReason");
    if (parsed.length === slpFiles.length) {
        proc();
        return;
    } else {
        console.log("Awaiting slp file processing:", parsed.length, slpFiles.length)
        return;
    }
};

main().then(() => process.exit(0));