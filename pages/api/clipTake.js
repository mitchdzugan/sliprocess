const fs = require('fs/promises');
const { createReadStream, statSync } = require("fs");
const slippiRoot = "/mnt/d/Slippi/";
const yoshiPron = "/mnt/d/__yo5h1_pr0n__/";

export default async (req, res) => {
    const { data } = await fs.readFile(process.cwd() + '/GALINTS.json').then(JSON.parse);
    const usage = await fs.readFile(process.cwd() + '/GALINT_USAGE.json').then(JSON.parse);
    const galints = Object.entries(data);
    const vidFiles = await fs.readdir(yoshiPron);
    const recorded = {};
    vidFiles.forEach((fname) => {
        if (fname.endsWith('.mp4')) {
            recorded[fname.replace('.mp4', '')] = true;
        }
    });
    for (const [galintId, { game }] of galints) {
        if (usage[galintId] === 'yes' && !recorded[game]) {
            console.log('Giving:', { game });
            const stat = await fs.stat(slippiRoot + game + ".slp");
            res.writeHead(200, {
                "Content-Type": "application/octet-stream",
                "Content-Length": stat.size,
                "Content-Disposition": "attachment; filename=" + game + ".slp"
            });
            createReadStream(slippiRoot + game + ".slp").pipe(res);
            return;
        }
    }
    const game = 'Game_20230807T085437';
    console.log('Giving:', { game });
    const stat = await fs.stat(slippiRoot + game + ".slp");
    res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": stat.size,
        "Content-Disposition": "attachment; filename=" + game + ".slp"
    });
    createReadStream(slippiRoot + game + ".slp").pipe(res);
    return;
};