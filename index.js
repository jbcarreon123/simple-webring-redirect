import express from "ultimate-express";
import cors from 'cors';
import config from './config/main.json' with { type: "json" };
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
function sample(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
app.use(cors());
app.use(function (req, res, next) {
    res.setHeader('X-Powered-By', 'simple-webring-redirect');
    next();
});
app.get(`${config.prefix ?? ''}/`, (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send('simple-webring-redirect');
});
app.get(`${config.prefix ?? ''}/:webring`, (req, res) => {
    const webring = req.params.webring;
    const webringPath = path.join(__dirname, `config/webrings/${webring}.json`);
    if (!existsSync(webringPath)) {
        res.status(404);
        res.setHeader('Content-Type', 'text/plain');
        res.send('cannot find webring ' + webring);
        return;
    }
    const webringData = JSON.parse(readFileSync(webringPath, 'utf-8'));
    if (req.query.way) {
        let member = webringData.members.find(({ username }) => username === req.query.name);
        res.setHeader('X-Webring-Name', webringData.name);
        res.setHeader('X-Webring-Url', webringData.url);
        if (!member) {
            if (req.query.way === 'rand' || req.query.way === 'random') {
                let randMember = sample(webringData.members);
                res.redirect(308, randMember?.url || webringData.url);
                return;
            }
            res.status(404);
            res.setHeader('Content-Type', 'text/plain');
            res.send('cannot find name ' + req.query.name);
        }
        let memberIndex = webringData.members.findIndex(({ username }) => username === req.query.name);
        let nextMember = webringData.members[memberIndex + 1] || webringData.members[0];
        let prevMember = webringData.members[memberIndex - 1] || webringData.members[webringData.members.length - 1];
        res.setHeader('X-Webring-Current-Member', member?.username || '');
        res.setHeader('X-Webring-Next-Member', nextMember?.username || '');
        res.setHeader('X-Webring-Prev-Member', prevMember?.username || '');
        switch (req.query.way) {
            case 'next':
                res.redirect(308, nextMember?.url || webringData.url);
                break;
            case 'prev':
            case 'previous':
                res.redirect(308, prevMember?.url || webringData.url);
                break;
        }
    }
    else {
        res.setHeader('Content-Type', 'application/json');
        res.send(readFileSync(webringPath, 'utf-8'));
    }
});
app.listen(config.port, () => {
    console.log('simple-webring-redirect now listening on port 6575');
});
