const DB = require("../../DB.js");
const _ = require("lodash");
/**
 *
 */
export default async (req, res) => {
  let results = await DB
    .select("*")
    .fromRaw("(SELECT SUBSTRING(filename, 6, 6) AS uniqueMonth, COUNT(id) as totalGames from \"Game\" GROUP BY uniqueMonth) as uniqueMonths")
    // .limit(2000)
    ;
  res.status(200).json(results);
  return;
};
