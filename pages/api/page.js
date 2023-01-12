const getPage = require("../../getPage.js");

export default async (req, res) => {
    const results = await getPage();
    res.status(200).json(results);
};