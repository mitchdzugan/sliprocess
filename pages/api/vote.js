const DB = require("../../DB.js");
const getPage = require("../../getPage.js");

export const config = { api: { bodyParser: true } };

const handler = async (req, res) => {
  const { comboId, score, name } = req.body;
  const row = await DB("Combo").select("*").where({ id: comboId });
  const combo = row[0];
  if (!combo) { res.status(404); }
  await DB("Votes") 
    .insert({ comboId, score, name });
  const results = await getPage(true); 
  res.status(200).json(results);
};

export default handler;

