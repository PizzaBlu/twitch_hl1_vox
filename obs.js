import OBSWebSocket from 'obs-websocket-js';
import chalk from 'chalk';
import path from 'path';

export class OBSController {
    constructor(config)
    {
        this.obs = new OBSWebSocket();
        this.sourceName = config.OBS_SOURCE_NAME;
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

        this.obs.on('MediaInputPlaybackEnded', (data) => {
            if (data.inputName == this.sourceName) {
                this.play_next();
            }
        });
    }

    async play(files) {
        this.queue.push(...files);
        if (!this.isPlaying) {
            this.play_next();
        }
    }

    async play_next() {
        await new Promise(r => setTimeout(r, 50));
        const file = this.queue.shift();
        if (!file) {
            this.isPlaying = false;
            return;
        }
        this.isPlaying = true;
        this.play_now(file);
    }

    async play_now(file) {
        console.log(chalk.dim('playing: ' + path.parse(file).base));
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
        } catch (err) {
            console.error(chalk.red('[OBS] Error playing file:'), err);
        }
        this.last = file;
    }
}