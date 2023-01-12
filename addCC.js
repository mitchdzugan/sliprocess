const DB = require("./DB.js");
const fs = require("fs/promises");
const _ = require('lodash');
const { SlippiGame }                    = require("@slippi/slippi-js");

const getGame = (path) => {
    const game = new SlippiGame('/mnt/d/Slippi/' + path + '.slp');
    const settings = game.getSettings();
    const metadata = game.getMetadata();
    game.isMe = (n) => {
        const characterId = (((settings || {}).players || [])[n] || {}).characterId;
        const codeA = ((((settings || {}).players || [])[n] || {}).connectCode || "").toLowerCase();
        const codeB = (((((metadata || {}).players || [])[n] || {}).names || {}).code || "").toLowerCase();
        return (characterId === 17) && (
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
    return game;
};

const main = async () => {
    let results = await DB
        .select("Game.*")
        .from("Game")
        .where("Game.filename", '>', 'Game_20221212T125254')
        .orderBy([ 
            { column: "Game.filename", order: 'asc' },
        ]);
    let i = 0;
    results.forEach(async (dbGame) => {
        const game = getGame(dbGame.filename)
        const isMe = game.isMe(0) || game.isMe(1);
        if (isMe) {
            const oppCC = game.getCode(game.isMe(0) ? 1 : 0);
            const oppDisplayName = game.getName(game.isMe(0) ? 1 : 0);
            let lastFrame = dbGame.lastFrame;
            if (!lastFrame) {
                const metadata = game.getMetadata();
                const mLastFrame = (metadata || {}).lastFrame;
                const cLastFrame = Math.max(...Object.keys(game.getFrames()).map(s => parseInt(s, 10)));
                lastFrame = mLastFrame || cLastFrame;
            }
            i++;
            console.log(i, results.length, oppCC, oppDisplayName);
            const saveGame = {
                ...dbGame,
                lastFrame,
                oppCC,
                oppDisplayName,
            };
            await DB("Game")
                .where({ filename: dbGame.filename })
                .update(saveGame);
        } else {
            i++;
            console.log(i, results.length);
        }
    });
}

main();
