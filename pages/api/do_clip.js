const fs = require('fs/promises');
const util                              = require("util");
const {
    existsSync,
}                                       = require("fs");
const { exec }                   = require("child_process");
const pexec = util.promisify(exec);

const removeIf = async (name) => {
    const hasIt = existsSync("./" + name);
    if (hasIt) {
        await fs.unlink("./" + name);
    }
};

export default async (req, res) => {
    const { comboId, clipStart, clipLength, game } = req.body;
    console.log({ comboId, clipStart, clipLength, game });
    const { data } = await fs.readFile(process.cwd() + '/GALINTS.json').then(JSON.parse);
    const usage = await fs.readFile(process.cwd() + '/GALINT_USAGE.json').then(JSON.parse);
    const clips = await fs.readFile(process.cwd() + '/CLIPS.json').then(JSON.parse);
    await removeIf(`./clip.mp4`);
    await pexec(
        `ffmpeg -i "/mnt/d/__yo5h1_pr0n__/${game}.mp4" -ss ${clipStart/60} -t ${clipLength/60} -s hd1080 -pix_fmt yuv420p -preset slow -profile:v baseline -movflags faststart -vcodec libx264 -b:v 64M -filter:v fps=60 -acodec aac -b:a 2M "./clip.mp4"`
    );
    console.log(
        `ffmpeg -i "/mnt/d/__yo5h1_pr0n__/${game}.mp4" -ss ${clipStart/60} -t ${clipLength/60} -vcodec libx264 -acodec aac -preset ultrafast -qp 0 -b:a 2M "./clip.mp4"`
    );
    await pexec(
        `mv ./clip.mp4 /mnt/d/__yo5h1_pr0n__/clips/GALINT-${comboId}.mp4`
    );
    clips[`GALINT-${comboId}`] = { clipStart, clipLength };
    await fs.writeFile(process.cwd() + '/CLIPS.json', JSON.stringify(clips));
    Object.keys(usage).forEach(k => {
        data[k].usage = usage[k];
    });
    Object.keys(data).forEach(k => {
        data[k].id = parseInt(k);
        data[k].clipStart = (clips[`GALINT-${k}`] || {}).clipStart;
        data[k].clipLength = (clips[`GALINT-${k}`] || {}).clipLength;
    });
    res.status(200).json(Object.values(data));
};