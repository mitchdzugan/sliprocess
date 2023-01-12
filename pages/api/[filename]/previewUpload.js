import multer from "multer";
const DB = require("../../../DB.js");

export const config = { api: { bodyParser: false } };

const rootDir = "/mnt/d/__yo5h1_pr0n__";
const storage = multer.diskStorage({
  destination: (req, res, cb) => cb(null, rootDir + "/preview"),
  filename: (req, res, cb) => cb(null, req.query.filename + ".mp4"),
});

const upload = multer({ storage });

const handler = async (req, res) => {
  const p = new Promise(R => {
    upload.single("preview")(req, {}, async (...args) => {
      R();
    });
  });
  await p;
  res.status(200).json({ done: true });
};

export default handler;
