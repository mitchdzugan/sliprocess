const DB = require("./DB.js");
const fs = require("fs/promises");
const _ = require('lodash');
const { SlippiGame }                    = require("@slippi/slippi-js");

const getGame = (path) => {
    const game = new SlippiGame('/mnt/d/Slippi/' + path + '.slp');
    const settings = game.getSettings();
    const info = settings.matchInfo || {};
    const matchId = info.matchId || '';
    game.isSlpRanked = matchId.startsWith('mode.ranked');
    const metadata = game.getMetadata();
    // console.log(metadata);
    game.isMe = (n) => {
        const characterId = (((settings || {}).players || [])[n] || {}).characterId;
        const codeA = ((((settings || {}).players || [])[n] || {}).connectCode || "").toLowerCase();
        const codeB = (((((metadata || {}).players || [])[n] || {}).names || {}).code || "").toLowerCase();
        return (true) && (
            codeA === "pink#715" || codeB === "pink#715"
        );
    };
    game.getCode = (n) => {
        const codeA = ((((settings || {}).players || [])[n] || {}).connectCode || "").toLowerCase();
        const codeB = (((((metadata || {}).players || [])[n] || {}).names || {}).code || "").toLowerCase();
        return codeA || codeB;
    };
    game.getName = (n) => {
        const nameA = (((settings || {}).players || [])[n] || {}).displayName;
        const nameB = ((((metadata || {}).players || [])[n] || {}).names || {}).netplay;
        return nameA || nameB;
    };
    game.gameMode = settings.gameMode;
    return game;
};

const main = async () => {
    let results = await DB
        .select("Game.*")
        .from("Game")
        .where("Game.filename", '>', 'Game_20230731T072222')
        .orderBy([ 
            { column: "Game.filename", order: 'asc' },
        ]);
    let i = 0;
    results.slice(0, 700).forEach(async (dbGame) => {
        const game = getGame(dbGame.filename)
        const isMe = game.isMe(0) || game.isMe(1);
        if (isMe && !dbGame.oppCC) {
            const isSlpRanked = game.isSlpRanked;
            const oppPort = (game.isMe(0)) ? 1 : 0
            const oppCC = game.getCode(oppPort);
            const oppDisplayName = game.getName(oppPort);
            let lastFrame = dbGame.lastFrame;
            if (!lastFrame) {
                const metadata = game.getMetadata();
                const mLastFrame = (metadata || {}).lastFrame;
                const cLastFrame = Math.max(...Object.keys(game.getFrames()).map(s => parseInt(s, 10)));
                lastFrame = mLastFrame || cLastFrame;
            }
            i++;
            console.log(i, results.length, oppCC, oppDisplayName, isSlpRanked);
            const saveGame = {
                ...dbGame,
                lastFrame,
                oppCC,
                oppDisplayName,
                isSlpRanked,
            };
            await DB("Game")
                .where({ filename: dbGame.filename })
                .update(saveGame);
        } else {
            i++;
            console.log(i, results.length, dbGame.oppCC, game.gameMode);
        }
    });
}

main();
