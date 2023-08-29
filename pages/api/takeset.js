const { cwd } = require("process");
const fs = require("fs/promises");
const AdmZip = require("adm-zip");
const _ = require("lodash");
const DB = require("../../DB.js");

const rootDir = "/mnt/d/__yo5h1_pr0n__";
const wipDir = rootDir + '/wip'; 
const finDir = rootDir + '/fin'; 
export default async (req, res) => {
    let results = await DB
        .select("Game.*")
        .from("Game")
        .where('Game.setId', '>', 0)
        .orderBy([ 
            { column: "Game.filename", order: 'asc' },
        ]);
    const _fins = await fs.readdir(finDir);
    const _wips = await fs.readdir(wipDir);
    const now = Math.floor(Date.now() / 1000);
    const fins = _fins.filter(fname => fname.endsWith('.avi'));
    const wips = _wips.filter(fname => fname.endsWith('.wip'));
    const fin = {};
    const wip = {};
    fins.forEach((fn) => {
        const parts = fn.split('.');
        fin[parts[0]] = true;
    });
    wips.forEach((fn) => {
        const parts = fn.split('.');
        const startedAt = parseInt(parts[1]);
        wip[parts[0]] = Math.max(startedAt, wip[parts[0]] || 0);
    });
    let setIdToRec = 0;
    results.forEach(({ setId }) => {
        const isFin = !!fin[setId];
        const isWip = !!wip[setId] && (now - wip[setId] < 60 * 60);
        if (!isFin && !isWip && !setIdToRec && setId > 1920) {
            setIdToRec = setId;
        }
    });
    if (!setIdToRec) { throw "No Sets To Process"; }
    const resultsBySetId = _.groupBy(results, 'setId');
    const games = _.sortBy(resultsBySetId[setIdToRec], 'filename');
    const tmpDir = cwd() + '/tmp';
    await fs.mkdir(tmpDir);
    let i = 0;
    for (const game of games) {
        const slpName = game.filename + '.slp';
        const src = "/mnt/d/Slippi/" + slpName;
        const dst = cwd() + '/tmp/' + i + '.slp';
        await fs.copyFile(src, dst);
        i++;
    }
    await fs.writeFile(
        cwd() + "/tmp/data.json",
        JSON.stringify({ games, setId: setIdToRec })
    );
    await fs.writeFile(wipDir + "/" + setIdToRec + "." + now + ".wip", "");
    const zip = new AdmZip();
    zip.addLocalFolder(tmpDir);
    var zipFileContents = zip.toBuffer();
    const fileName = 'games.zip';
    const fileType = 'application/zip';
    res.writeHead(200, {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': fileType,
    });
    res.end(zipFileContents);
    await fs.rm(tmpDir, { recursive: true, force: true });
    return;
}