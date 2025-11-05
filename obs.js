import OBSWebSocket from 'obs-websocket-js';
import chalk from 'chalk';
import path from 'path';

const deedoo = [
    'DEEOO',
    'DOOP',
    'DADEDA',
    'BIZWARN',
    'BUZWARN',
];

const comma = [
    '_COMMA',
    '_PERIOD',
];

export class OBSController {
    constructor(config)
    {   
        this.config = config;
        this.obs = new OBSWebSocket();
        this.sourceName = config.OBS_SOURCE_NAME;
        this.textSourceName = config.OBS_TEXT_SOURCE_NAME;
        this.host = config.OBS_HOST;
        this.password = config.OBS_PASSWORD;
        this.queue = [];
        this.last = '';
        this.playing = false;
    }

    async connect() {
        try {
            await this.obs.connect(this.host, this.password);
            console.log(chalk.dim('[OBS] connected'));
        } catch (err) {
            console.error(chalk.red('[OBS] connection failed:'), err);
        }

        this.obs.on('MediaInputPlaybackEnded', async (data) => {
            if (data.inputName == this.sourceName) {
                this.clear_text();
                this.play_next();
            }
        });
    }

    async clear_text() {
        await this.obs.call('SetInputSettings', {
            inputName: this.textSourceName,
            inputSettings: { text: '' },
        });
    }

    async stop() {
        this.queue = [];
        this.isPlaying = false;
        await this.clear_text();
        await this.obs.call('TriggerMediaInputAction', {
            inputName: this.sourceName,
            mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PAUSE',
        });
    }

    async play(files) {
        await this.stop();
        this.queue.push(...files);
        if (!this.isPlaying) {
            await this.play_next();
        }
    }

    async play_next() {
        await new Promise(r => setTimeout(r, 50));
        const file = this.queue.shift();
        if (!file) {
            await this.stop();
            return;
        }
        this.isPlaying = true;
        await this.play_now(file);
    }

    async play_now(file) {
        const fileinfo = path.parse(file);
        let text = fileinfo.name.toUpperCase();
        if (deedoo.includes(text)) text = this.config.DEEOOO_REPLACE;
        if (comma.includes(text)) text = '';
        console.log(chalk.dim('playing: ' + fileinfo.base));
        try {
            if (this.last == file) {
                await this.obs.call('TriggerMediaInputAction', {
                    inputName: this.sourceName,
                    mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART',
                });
                await this.obs.call('TriggerMediaInputAction', {
                    inputName: this.sourceName,
                    mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PLAY',
                });
            } else {
                await this.obs.call('SetInputSettings', {
                    inputName: this.sourceName,
                    inputSettings: { local_file: file },
                });
            }

            await this.obs.call('SetInputSettings', {
                inputName: this.textSourceName,
                inputSettings: { text },
            });
        } catch (err) {
            console.error(chalk.red('[OBS] Error playing file:'), err);
        }
        this.last = file;
    }
}