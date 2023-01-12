const { createReadStream, statSync } = require("fs");
const fs = require("fs/promises");
const DB = require("../../DB.js");
const _ = require("lodash");

const slippiRoot = "/mnt/d/Slippi/";
const iname = "Game_20210917T135159.slp";
const gname = "Game_20211024T045158.slp";
const hname = "Game_20210714T204117.slp";
const rname = "Game_20211009T190828.slp";
const fname = rname;
const testFile = slippiRoot + fname;

const shuffle = (_array) => {
  const array = [..._array];
  let currentIndex = array.length;
  while (currentIndex != 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [ array[randomIndex], array[currentIndex]];
  }
  return array;
}

/**
 *
 */
export default async (req, res) => {
  const dbGames = await DB("Game").select("*");
  const dbGamesByFilename = _.keyBy(dbGames, "filename");
  const _files = await fs.readdir(slippiRoot);
  console.log(_files.length, 'length all')
  let minTouched = null;
  let minFile = null;
  const finish = async (file) => {
    console.log('Giving:', { file });
    const filename = file.split(".slp")[0].trim();
    const dbGame = dbGamesByFilename[filename];
    if (dbGame) {
      const saveGame = { ...dbGame, inProgress: true, touched: new Date() };
      await DB("Game") 
        .where({ filename }) 
        .update(saveGame);
    } else {
      await DB("Game") 
        .insert({ filename, inProgress: true, touched: new Date() });
    }
    const stat = await fs.stat(slippiRoot + file);
    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Content-Length": stat.size,
      "Content-Disposition": "attachment; filename=" + file
    });
    createReadStream(slippiRoot + file).pipe(res);
  };
  const files = _files.filter(fname => {
    if (!fname.endsWith('.slp')) { return false; }
    return true;
    const mtime = statSync(slippiRoot + fname).mtime;
    const seconds = ((new Date().getTime()) - mtime) / 1000.0;
    return seconds > (60 * 9);
  });
  console.log('filesLength', files.length);
  for (const file of shuffle(files)) {
    if (!file.endsWith('.slp')) { continue; }
    const filename = file.split(".slp")[0].trim();
    const dbGame = dbGamesByFilename[filename];
    const isLatest = Boolean(dbGame && (dbGame.parseVersion === 1 || !!dbGame.skipReason));
    const isNewlyProcessing = Boolean(dbGame && !isLatest && dbGame.inProgress && (
      (((new Date()) - dbGame.touched) / 36e5) < 10
    ));
    if (isNewlyProcessing) {
      if (!minTouched || dbGame.touched < minTouched) {
        minTouched = dbGame.touched;
        minFile = file;
      }
    }
    if (isLatest || isNewlyProcessing) { continue; }
    finish(file);
    return;
  }
  console.log('getting to here...');
  finish(minFile || files[0]);
  return;
};
