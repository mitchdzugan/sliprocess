const DB = require("../../DB.js");
const getSetsPage = require("../../getSetsPage.js");

export const config = { api: { bodyParser: true } };

const handler = async (req, res) => {
  const curr = await DB
    .select("Game.*")
    .from("Game")
    .whereNotNull('Game.oppCC')
    .orderBy([ 
        { column: "Game.filename", order: 'asc' },
    ]);
  const { result, filename } = req.body;
  let back1, back2, back3;
  const nextSetId = Math.max(...curr.map(g => g.setId || 0)) + 1;
  console.log({ result, filename })
  for (const dbGame of curr) {
    if (dbGame.filename === filename) {
      const isW = result === 'yes';
      const isL = result === 'no';
      const isNotRanked = result === 'null'
      const isRanked = isW || isL;
      if (!isRanked && !isNotRanked) { break; }
      const isNewSet = isRanked && (
        !back1 ||
        dbGame.oppCC !== back1.oppCC ||
        (back2 && back3 && back1.setId === back3.setId)
      ) || false;
      const saveGame = !isRanked ? { ...dbGame, setId: 0 } : {
        ...dbGame,
        setId: isNewSet ? nextSetId : back1.setId,
        isWin: isW,
      };
      await DB("Game")
        .where({ filename: dbGame.filename })
        .update(saveGame);
      break;
    }
    back3 = back2;
    back2 = back1;
    back1 = dbGame;
  }
  const results = await getSetsPage(); 
  res.status(200).json(results);
};

export default handler;

