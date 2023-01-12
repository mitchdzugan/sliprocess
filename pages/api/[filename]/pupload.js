import multer from "multer";
const DB = require("../../../DB.js");

export const config = { api: { bodyParser: false } };

const rootDir = "/mnt/d/__yo5h1_pr0n__/preview";
const storage = multer.diskStorage({
  destination: (req, res, cb) => cb(null, rootDir),
  filename: (req, res, cb) => cb(null, req.query.filename + ".mp4"),
});

const upload = multer({ storage });

const handler = async (req, res) => {
  const { filename } = req.query;
  const row = await DB("Game").select("*").where({ filename });
  const game = row[0] || {};
  if (game.parseVersion === 1) {
    res.status(200).json({ done: true });
    return;
  }
  const p = new Promise(R => {
    upload.single("vod")(req, {}, async (...args) => {
      const Game = JSON.parse(req.body.Game);
      const Combos = JSON.parse(req.body.Combos);
      const saveGame = {
        ...game,
        ...Game,
        inProgress: false,
        touched: new Date(),
        parseVersion: 1,
        skipReason: null,
        hd: false
      };
      if (Combos.length) {
        const comboIds = await DB("Combo")
          .returning("id")
          .insert(Combos.map(({ Moves, ...Combo }) => ({ gameId: game.id, ...Combo })))
        await DB("Move").insert(
          Combos.flatMap(({ Moves }, i) => Moves.map(m => ({ comboId: comboIds[i], ...m })))
        );
      }
      await DB("Game")
        .where({ filename })
        .update(saveGame);
      R();
    });
  });
  await p;
  res.status(200).json({ done: true });
};

export default handler;

