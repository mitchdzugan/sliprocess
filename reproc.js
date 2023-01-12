const {
    createReadStream,
    createWriteStream,
    existsSync,
}                                       = require("fs");
const fs                                = require("fs/promises");
const { SlippiGame }                    = require("@slippi/slippi-js");
const DB = require("./DB.js");

const getGame = (path) => {
    const game = new SlippiGame('/mnt/d/Slippi/' + path);
    const settings = game.getSettings();
    const metadata = game.getMetadata();
    game.isMe = (n) => {
        const characterId = (((settings || {}).players || [])[n] || {}).characterId;
        const codeA = ((((settings || {}).players || [])[n] || {}).connectCode || "").toLowerCase();
        const codeB = (((((metadata || {}).players || [])[n] || {}).names || {}).code || "").toLowerCase();
        return (characterId === 17 || characterId === 20) && (
            codeA === "dz#788"   || 
            codeA === "sion#430" ||
            codeA === "lube#420" ||
            codeB === "dz#788"   || 
            codeB === "sion#430" || 
            codeB === "lube#420"
        );
    };
    game.isHax = (n) => {
        const codeA = ((((settings || {}).players || [])[n] || {}).connectCode || "").toLowerCase();
        const codeB = (((((metadata || {}).players || [])[n] || {}).names || {}).code || "").toLowerCase();
        return (
            codeA === "xx#02" ||
            codeB === "xx#02"
        );
    };
    return game;
};

const getData = (game) => {
    const settings = game.getSettings();
    const isSingles = settings.players.length === 2;
    const metadata = game.getMetadata();
	const mLastFrame = (metadata || {}).lastFrame;
	const cLastFrame = Math.max(...Object.keys(game.getFrames()).map(s => parseInt(s, 10)));
	const lastFrame = mLastFrame || cLastFrame;
	const stats = game.getStats();

    const is0 = game.isMe(0);
    const is1 = game.isMe(1);
    const isDitto = (
        settings.players[0].characterId === settings.players[1].characterId
    );
    const characterId = settings.players[is0 ? 1 : 0].characterId;
    const stageId = settings.stageId;
    const myIndex = is0 ? 0 : 1;
    const amIn = is0 || is1;
    const isShort = lastFrame < 60 * 30;

    let skipReason = null;
    if (!amIn) {
        skipReason = "NotInOrNotYoshi";
    } else if (isShort) {
        skipReason = "isShort";
    } else if (isDitto) {
        skipReason = "isDitto"
    } else if (!isSingles) {
        skipReason = "isDoubles";
    } else if (characterId > 25) {
        skipReason = "invalidCharacter";
    } else if (stageId < 2 || stageId > 32 || stageId === 21) {
        skipReason = "invalidStage";
    }

    if (skipReason) {
        return { isSkip: true, skipReason };
    }

    const frames = game.getFrames();
    let i = lastFrame;
    while (!frames[i].players[0].post) { console.log(i); i--; }
    const { players } = frames[i];
    const winnerIndex = !stats.gameComplete ? null : (
        players[0].post.stocksRemaining === 0 ? 1 : 0
    );
    const myEndStocks   = players[is0 ? 0 : 1].post.stocksRemaining;
    const myEndPercent  = !myEndStocks  ? 0 : players[is0 ? 0 : 1].post.percent;
    const oppEndStocks  = players[is0 ? 1 : 0].post.stocksRemaining;
    const oppEndPercent = !oppEndStocks ? 0 : players[is0 ? 1 : 0].post.percent;
    const stockData = [
        [],
        [],
    ];
    stats.stocks.forEach(({ playerIndex, count, startFrame }) => {
        stockData[playerIndex].push({ startFrame, count });
    });
    stockData[0].sort((a, b) => a.count - b.count);
    stockData[1].sort((a, b) => a.count - b.count);
    const getStock = (frame) => {
        let stock = null;
        stockData[is0 ? 1 : 0].forEach(({ startFrame, count }) => {
            if (frame < startFrame || stock) { return; }
            stock = count;
        });
        return stock || 4;
    };
    const Combos = stats.conversions
        .filter(({ playerIndex }) => playerIndex !== myIndex)
        .map(({ startFrame, endFrame, startPercent, endPercent, moves, didKill, openingType }) => ({
            startPercent,
            startFrame,

            damage: (endPercent - startPercent) >= 0 ? (endPercent - startPercent) : moves.reduce((tot, m) => tot + m.damage, 0),
            frames: (endFrame - startFrame) >= 0 ? (endFrame - startFrame) : (lastFrame - startFrame),
            didKill: (startFrame > endFrame) ? true : didKill,

            damageOld: endPercent - startPercent,
            framesOld: endFrame - startFrame,
            didKillOld: didKill,

            openingType,
            stock: getStock(startFrame),
            Moves: moves.map(({ moveId, damage }, nth) => (
                { nth, moveId, damage }
            )),
        }))
        .map((t) => ({ 
            ...t, 
            needsChange: (
                t.didKill !== t.didKillOld ||
                t.damage !== t.damageOld ||
                t.frames !== t.framesOld
            )
        }))
        ;
    return {
        isSkip: false,
        Game: {
            characterId,
            stageId,
            lastFrame,
            myPort: settings.players[is0 ? 0 : 1].port - 1,
            myIndex,
            oppEndStocks,
            oppEndPercent,
            myEndStocks,
            myEndPercent,
            endResult: (
                !stats.gameComplete ? 5 : (winnerIndex === myIndex ? 1 : 0)
            )
        },
        Combos,
    };
};

const main = async () => {
    const files = await fs.readdir("/mnt/d/Slippi");
    const slpFiles = files.filter(s => s.endsWith(".slp"));
    // const slpFiles = ['Game_20210119T095925.slp']
    const INI = 0;
    let i = INI;
    for (const file of slpFiles.slice(INI)) {
        const game = getGame(file);
        const vod = "/mnt/d/__yo5h1_pr0n__/preview/" + file.split('.')[0] + ".mp4"
        console.log([i, slpFiles.length]);
        if (existsSync(vod) && (game.isHax(0) || game.isHax(1))) {
            console.error("file '/mnt/d/__yo5h1_pr0n__/preview/" + file.split('.')[0] + ".mp4'");
        }
        i++;
    };
};

main();
