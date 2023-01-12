const DB = require("./DB.js");
const fs = require("fs/promises");
const _ = require('lodash');

module.exports = async (shuffle = false) => {
    let results = await DB
        .select("Game.*")
        .from("Game")
        .whereNotNull('Game.oppCC')
        .orderBy([ 
            { column: "Game.filename", order: 'asc' },
        ]);
        // .limit(2000)
        ;
    results = results.map(r => {
        const { filename } = r;
        const shlice = (a, b) => filename.slice(a, a + b);
        const Y = shlice(5, 4);
        const M = shlice(9, 2);
        const Dh = shlice(11, 5);
        const m = shlice(16, 2);
        const s = shlice(18, 2);
        const date = Date.parse(`${Y}-${M}-${Dh}:${m}:${s}`);
        return {
            ...r,
            Y,
            M,
            date,
        };
    });
    return results;
};
