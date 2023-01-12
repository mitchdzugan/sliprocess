const DB = require("../../DB.js");
const getPage = require("../../getPage.js");

export const config = { api: { bodyParser: true } };

const handler = async (req, res) => {
  const { comboId, bossrush } = req.body;
  const row = await DB("Combo").select("*").where({ id: comboId });
  const combo = row[0];
  const saveCombo = {
    ...combo,
    miley: bossrush === "null" ? null : bossrush,
  };
  await DB("Combo")
    .where({ id: comboId })
    .update(saveCombo);
  const results = await getPage(); 
  res.status(200).json(results);
};

export default handler;

