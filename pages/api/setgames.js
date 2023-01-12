const getPage = require("../../getSetsPage.js");

export default async (req, res) => {
    const results = await getPage();
    res.status(200).json(results);
};