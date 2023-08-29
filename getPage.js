const DB = require("./DB.js");
const fs = require("fs/promises");
const _ = require('lodash');

module.exports = async (shuffle = false) => {
    const files = await fs.readdir("/mnt/d/Slippi");
    const slpFiles = files.filter(s => s.endsWith(".slp"));
    const votes = await DB
        .select("Votes.*").from("Votes");
    const votesByPersonCombo = _.groupBy(votes, ({ name, comboId }) => JSON.stringify({ name, comboId }));
    const activeVotes = Object.values(_.mapValues(votesByPersonCombo, (votes) => _.maxBy(votes, 'id')));
    const votesByCombo = _.groupBy(activeVotes, 'comboId');
    console.log(votesByCombo);
    const parsed = await DB
        .select("Game.*").from("Game")
        .where({ parseVersion: 1 })
        .orWhereNotNull("skipReason");
    const recorded = await DB
        .select("Game.*").from("Game")
        .where({ parseVersion: 1 });
    console.log("slpFiles", slpFiles.length, parsed.length, recorded.length);
    let results = await DB
        .select("Combo.*")
        .count("Move.id as moves")
        .min("Game.stageId as stageId")
        .min("Game.characterId as characterId")
        .min("Game.filename as filename")
        .from("Move")
        .join("Combo", "Move.comboId", "Combo.id")
        .join("Game", "Combo.gameId", "Game.id")
        // .where(w => ( w.whereNull("Combo.bossrush").orWhereNot("Combo.bossrush", "no")))
        .andWhere({ "Combo.didKill": true })
        .groupBy("Combo.id", "Game.touched")
        .orderBy([ 
            { column: "Game.touched", order: 'asc' },
            { column: "Combo.startFrame", order: 'asc' },
        ])
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
        const votes = votesByCombo[r.id] || [];
        const score = _.sumBy(votes, 'score');
        return {
            ...r,
            Y,
            M,
            date,
            score,
            votes: _.mapValues(_.keyBy(votes, 'name'), 'score')
        };
    })
    const byInterest = (v) => v.frames / (parseInt(v.moves));
    const byDate = (v) => v.date;
    const sortBy = (f) => { results.sort((a, b) => f(a) - f(b)); };
    sortBy(byInterest);
    // results.reverse();
    // results = results.filter(({ stageId, characterId }) => `${characterId}.` === '18.');
    results = results.filter(({ moves, bossrush, Y, M, id }) => ((`${Y}.${M}` === '2022.09' ||  `${Y}.${M}` === '2023.08' ||  `${Y}.${M}` === '2023.07' || bossrush === 'yes' || bossrush === 'def'|| bossrush === 'rep') && (
        parseInt(moves) > 2 || bossrush === 'yes' || bossrush === 'maybe' || bossrush === 'idk' || bossrush === 'def'|| bossrush === 'rep'
    )) || id === 265541 || id === 80660)

    return {
        combos: results,
        all: slpFiles.length,
        processed: parsed.length,
        recorded: recorded.length,
    };
    return results;
};
