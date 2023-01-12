const DB = require("../../../DB.js");

const CharSprite = {
    0: "falcon",
    1: "dk",
    2: "fox",
    3: "gnw",
    4: "kirby",
    5: "bowser",
    6: "link",
    7: "luigi",
    8: "mario",
    9: "marth",
    10: "mewtwo",
    11: "ness",
    12: "peach",
    13: "pika",
    14: "ics",
    15: "puff",
    16: "samus",
    17: "yoshi",
    18: "zelda",
    19: "sheik",
    20: "falco",
    21: "ylink",
    22: "doc",
    23: "roy",
    24: "pichu",
    25: "ganon"
};

const Char = {
    0: "Falcon",
    1: "DK",
    2: "Fox",
    3: "G&W",
    4: "Kirby",
    5: "Bowser",
    6: "Link",
    7: "Luigi",
    8: "Mario",
    9: "Marth",
    10: "Mewtwo",
    11: "Ness",
    12: "Peach",
    13: "Pika",
    14: "ICs",
    15: "Puff",
    16: "Samus",
    17: "Yoshi",
    18: "Zelda",
    19: "Sheik",
    20: "Falco",
    21: "Young Link",
    22: "Dr. Mario",
    23: "Roy",
    24: "Pichu",
    25: "Ganondorf"
};

const handler = async (req, res) => {
    const { filename } = req.query;
    const games = await DB("Game")
        .select("*")
        .where({ setId: filename })
        .orderBy([ 
            { column: "Game.filename", order: 'asc' },
        ]);
    console.log(games)
    const g1 = games[0]
    if (!g1) { throw "Unknown Set"; }
    const isLeft = g1.myIndex === 0;
    const oppCC = g1.oppCC;
    const oppDisplayName = g1.oppDisplayName;
    const oppSprite = CharSprite[g1.characterId];
    const shlice = (a, b) => g1.filename.slice(a, a + b);
    const Y = parseInt(shlice(5, 4));
    const M = parseInt(shlice(9, 2));
    const D = parseInt(shlice(11, 2));
    const h = shlice(14, 2);
    const m = shlice(16, 2);
    console.log({ h })
    const [hh, hd] = ({
        [0] : [12, 'am'],
        [1] : [1, 'am'],
        [2] : [2, 'am'],
        [3] : [3, 'am'],
        [4] : [4, 'am'],
        [5] : [5, 'am'],
        [6] : [6, 'am'],
        [7] : [7, 'am'],
        [8] : [8, 'am'],
        [9] : [9, 'am'],
        [10]: [10, 'am'],
        [11]: [11, 'am'],
        [12]: [12, 'pm'],
        [13]: [1, 'pm'],
        [14]: [2, 'pm'],
        [15]: [3, 'pm'],
        [16]: [4, 'pm'],
        [17]: [5, 'pm'],
        [18]: [6, 'pm'],
        [19]: [7, 'pm'],
        [20]: [8, 'pm'],
        [21]: [9, 'pm'],
        [22]: [10, 'pm'],
        [23]: [11, 'pm'],
    })[parseInt(h, 10)]
    const date = `${M}/${D}/${Y} ${hh}:${m}${hd}`;
    let oppCharacters = "";
    const seen = {};
    for (const g of games) {
        const char = Char[g.characterId];
        if (!seen[char]) { oppCharacters += '/' + char; }
        seen[char] = true;
    }
    oppCharacters = oppCharacters.substring(1);
    const data = {
        date, isLeft, oppCC, oppDisplayName, oppSprite, oppCharacters
    }
    res.status(200).json(data);
};

export default handler;
