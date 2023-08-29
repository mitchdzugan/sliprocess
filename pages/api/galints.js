const fs = require('fs/promises');

export default async (req, res) => {
    const { data } = await fs.readFile(process.cwd() + '/GALINTS.json').then(JSON.parse);
    const usage = await fs.readFile(process.cwd() + '/GALINT_USAGE.json').then(JSON.parse);
    const clips = await fs.readFile(process.cwd() + '/CLIPS.json').then(JSON.parse);
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