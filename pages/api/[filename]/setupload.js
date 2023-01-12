import multer from "multer";
const DB = require("../../../DB.js");

export const config = { api: { bodyParser: false } };

const rootDir = "/mnt/d/__yo5h1_pr0n__/fin";
const storage = multer.diskStorage({
  destination: (req, res, cb) => cb(null, rootDir),
  filename: (req, res, cb) => cb(null, req.query.filename + ".avi"),
});

const upload = multer({ storage });

const handler = async (req, res) => {
  const p = new Promise(R => {
    upload.single("vod")(req, {}, async (...args) => {
      R();
    });
  });
  await p;
  res.status(200).json({ done: true });
};

export default handler;

