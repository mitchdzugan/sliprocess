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
  const dbGames = await DB("Game").select("*");
  const dbGamesByFilename = _.keyBy(dbGames, "filename");
  const files = await fs.readdir(slippiRoot);
  for (const file of shuffle(files)) {
    const filename = file.split(".slp")[0].trim();
    const dbGame = dbGamesByFilename[filename];
    const isLatest = Boolean(dbGame && dbGame.parseVersion === 1);
    const isNewlyProcessing = Boolean(dbGame && dbGame.inProgress && (
      (((new Date()) - dbGame.touched) / 36e5) < 30
    ));
    console.log({ filename, dbGame, isLatest, isNewlyProcessing });
    if (isLatest || isNewlyProcessing) { continue; }
    /*
    if (dbGame) {
      await DB("Game") 
        .where({ filename }) 
        .update({ ...dbGame, inProgress: true, touched: new Date() });
    } else {
      await DB("Game") 
        .insert({ filename, inProgress: true, touched: new Date() });
    }
    */
    const stat = await fs.stat(slippiRoot + file);
    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Content-Length": stat.size,
      "Content-Disposition": "attachment; filename=" + file
    });
    createReadStream(slippiRoot + file).pipe(res);
    break;
  }
};
