import tmi from 'tmi.js';
import {get_config} from './config.js';
import {get_vox_words} from './files.js';
import {OBSController} from './obs.js';
import chalk from 'chalk';

// CONFIG
const config = get_config();
if (config === false) {
    process.exit();
}

let last = 0;

// VOX WORDS
const vox_words = get_vox_words(
    config.PATH,
    config.BLACKLIST.split(',').map(x=>x.trim()),
);

console.log(Object.keys(vox_words).join('\n'));

function get_files(parts) {
    return parts.map(word=>vox_words[word]);
}

// OBS
const obs = new OBSController(config);
await obs.connect();

// TWITCH BOT
const client = new tmi.Client({
	channels: [config.CHANNEL],
});
await client.connect();
client.on('message', (channel, tags, message, self) => {
    if (self) return;

    const parts = message.replaceAll(',', ' _comma').replaceAll('.', ' _period').toLowerCase().split(' ');
    const command = parts.shift();
    if (command != config.COMMAND) return;

    const irc = `${parts.join(' ')} (${tags['display-name']})`;

    if (parts.every(word=>Object.keys(vox_words).includes(word))) {
        if (Date.now()-last < config.COOLDOWN) {
            console.log(chalk.yellow('skipped due to cooldown:'), irc);
            return;
        }
        
        console.log(chalk.blueBright('speaking:'), irc);
        last = Date.now();
        obs.play(get_files(parts));
    } else {
        console.log(chalk.yellow('rejected due to missing words:'), irc);
    }
});

obs.play(get_files(config.START_MESSAGE.split(' ')));
