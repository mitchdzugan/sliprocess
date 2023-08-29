const { createReadStream } = require("fs");
const fs = require("fs/promises");
const DB = require("../../DB.js");
const _ = require("lodash");

const slippiRoot = "/mnt/d/Slippi/";

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
  const dbGames = await DB("Game")
    .select("*")
    .join("Combo", "Game.id", "Combo.gameId") 
    .where('Combo.bossrush', 'rep');
  const dbGamesByFilename = _.keyBy(dbGames, "filename");
  console.log(Object.keys(dbGamesByFilename).length);
  const files = await fs.readdir(slippiRoot);
  let minTouched = null;
  let minFile = null;
  const finish = async (file) => {
    console.log('Giving:', { file });
    const filename = file.split(".slp")[0].trim();
    const row = await DB("Game").select("*").where({ filename }); 
    const dbGame = row[0] || {};
    if (dbGame) {
      await DB("Game") 
        .where({ filename }) 
        .update({ ...dbGame, inProgress: true, touched: new Date() });
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
  for (const file of shuffle(files)) {
    if (!file.endsWith('.slp')) { continue; }
    const filename = file.split(".slp")[0].trim();
    const dbGame = dbGamesByFilename[filename];
    if (!dbGame) { continue; }
    const isHd = Boolean(dbGame && dbGame.hd)
    const isNewlyProcessing = Boolean(dbGame && !isHd && dbGame.inProgress && (
      (((new Date()) - dbGame.touched) / 36e5) < 30
    ));
    if (isNewlyProcessing) {
      if (!minTouched || dbGame.touched < minTouched) {
        minTouched = dbGame.touched;
        minFile = file;
      }
    }
    if (isHd || isNewlyProcessing) { continue; }
    finish(file);
    return;
  }
  if (!minFile) { return; }
  finish(minFile);
  return;
};
