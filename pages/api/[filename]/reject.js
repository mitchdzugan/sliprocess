const DB = require("../../../DB.js");

export const config = { api: { bodyParser: true } };

const handler = async (req, res) => {
  const { filename } = req.query;
  const row = await DB("Game").select("*").where({ filename });
  const game = row[0];
  const saveGame = {
    ...game,
    inProgress: false,
    touched: new Date(),
    skipReason: req.body.skipReason,
  };
  await DB("Game")
    .where({ filename })
    .update(saveGame);
  res.status(200).json({ done: true });
};

export default handler;

