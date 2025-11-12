import tmi from 'tmi.js';
import {get_config} from './config.js';
import {get_vox_words} from './files.js';
import {OBSQueue} from './obs.js';
import {from_string} from './numbers.js';
import chalk from 'chalk';

// CONFIG
const config = get_config();
if (config === false) {
    process.exit();
}

let last = 0;
const user_last = {};

// VOX WORDS
const vox_words = get_vox_words(
    config.PATH,
    config.BLACKLIST.split(',').map(x=>x.trim()),
);

function get_files(parts) {
    return parts.map(word=>vox_words[word]);
}

// OBS
const obs = new OBSQueue(config);
await obs.connect();

// TWITCH BOT
const login =
    config.USERNAME &&
    config.PASSWORD &&
    config.USERNAME.length > 0 &&
    config.PASSWORD.length > 0
    ;

const tmi_conf = {
	channels: [config.CHANNEL],
};
if (login) {
    tmi_conf.identity = {
        username: config.USERNAME,
        password: config.PASSWORD,
    }
    tmi_conf.optoins = {debug:true};
}

const client = new tmi.Client(tmi_conf);
await client.connect();

async function send(message) {
    if (login) {
        try {
            await client.say(config.CHANNEL, message);
        } catch (err) {
            console.error(err);
        }
    } else {
        console.log(chalk.gray(message));
    }
}

client.on('message', (channel, tags, message, self) => {
    if (self) return;

    let parts = message
        .replaceAll(',', ' _comma')
        .replaceAll('.', ' _period')
        .toLowerCase()
        .split(' ')
        ;
    const command = parts.shift();
    if (command != config.COMMAND) return;

    parts = parts
        .flatMap(from_string)
        .filter(x=>String(x).length>0)
        ;

    const rest = parts.join(' ');
    const user = tags.username;
    const display_name = tags['display-name'];
    const irc = `${rest} (${display_name})`;

    if (config.REJECT_CHARS.split('').some(s=>rest.includes(s))) {
        console.log(chalk.yellow('igonring message with symbols:'), irc);
        return;
    }

    if (!(user in user_last)) user_last[user] = 0;

    if (parts.every(word=>Object.keys(vox_words).includes(word))) {
        if (Date.now()-user_last[user] < config.USER_COOLDOWN) {
            console.log(chalk.yellow('skipped due to user cooldown:'), irc);
            return;
        }
        if (Date.now()-last < config.COOLDOWN) {
            console.log(chalk.yellow('skipped due to global cooldown:'), irc);
            return;
        }

        console.log(chalk.blueBright('speaking:'), irc);

        last = Date.now();
        user_last[user] = Date.now();

        obs.play(get_files(parts));
    } else {
        console.log(chalk.yellow('rejected due to missing words:'), irc);
    }
});

obs.play(get_files(config.START_MESSAGE.split(' ')));
