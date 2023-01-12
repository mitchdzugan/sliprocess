const fs = require("fs/promises");
const DB = require("../../DB.js");
const _ = require("lodash");
const { SlippiGame } = require("@slippi/slippi-js");

const slippiRoot = "/mnt/d/Slippi/";

export default async (req, res) => {
  const dbGames = await DB("Game") 
    .select("*")
    .where({ skipReason: "NotInOrNotYoshi" });
  let fixed = 0;
  for (const dbGame of dbGames) {
      const game = new SlippiGame(slippiRoot + dbGame.filename + ".slp");
      const settings = game.getSettings();
      const metadata = game.getMetadata();
      game.isMe = (n) => {
          const characterId = (((settings || {}).players || [])[n] || {}).characterId;
          const codeA = ((((settings || {}).players || [])[n] || {}).connectCode || "").toLowerCase();
          const codeB = (((((metadata || {}).players || [])[n] || {}).names || {}).code || "").toLowerCase();
          return characterId === 17 && (
              codeA === "dz#788"   || 
              codeA === "lube#420" ||
              codeB === "dz#788"   || 
              codeB === "lube#420"
          );
      };
      const is0 = game.isMe(0);
      const is1 = game.isMe(1);
      if (is0 || is1) {
          fixed += 1;
          console.log("KILL", dbGame.filename); 
          const saveGame = { 
            ...dbGame, 
            inProgress: false, 
            skipReason: null, 
          };
          await DB("Game")
            .where({ id: dbGame.id }) 
            .update(saveGame);
      }
  }
  res.status(200).json({ fixed });
};