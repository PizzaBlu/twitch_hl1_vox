import EventEmitter from 'events';
import OBSWebSocket from 'obs-websocket-js';
import chalk from 'chalk';
import path from 'path';

const deedoo = [
    'DEEOO',
    'DOOP',
    'DADEDA',
    'WOOP',
    'BIZWARN',
    'BUZWARN',
];

const comma = [
    '_COMMA',
    '_PERIOD',
];

const PAUSED = 'OBS_MEDIA_STATE_PAUSED';
const PLAYING = 'OBS_MEDIA_STATE_PLAYING';
const ENDED = 'OBS_MEDIA_STATE_ENDED';
const STOPPED = 'OBS_MEDIA_STATE_STOPPED';

class OBSController extends EventEmitter {
    constructor (config) {
        super();
        this.config = config;
        this.obs = new OBSWebSocket();
    }

    async connect() {
        try {
            await this.obs.connect(this.config.OBS_HOST, this.config.OBS_PASSWORD);
            console.log(chalk.dim('[OBS] connected'));
        } catch (err) {
            console.error(chalk.red('[OBS] connection failed:'), err);
        }

        this.obs.on('MediaInputPlaybackEnded', async (data) => {
            if (data.inputName == this.config.OBS_SOURCE_NAME) {
                this.emit('playback_end', data);
            }
        });
    }

    async get_state() {
        return (await this.obs.call('GetMediaInputStatus', {inputName: this.config.OBS_SOURCE_NAME})).mediaState;
    }

    async get_file() {
        return (await this.obs.call('GetInputSettings', {inputName: this.config.OBS_SOURCE_NAME})).inputSettings.local_file;
    }

    async play_async(file) {
        const self = this;

        const fileinfo = path.parse(file);
        function print(...parts) {
            console.log(chalk.dim(`[${fileinfo.base}]: ` + parts.join([' '])));
        }

        // get info about current state in OBS
        const current = await this.get_file();
        const same = (path.resolve(file) === path.resolve(current));

        if (same) print('restarting'); else print('playing');

        // get caption text
        let caption_text = fileinfo.name.toUpperCase();
        if (deedoo.includes(caption_text)) caption_text = this.config.DEEOO_REPLACE;
        if (comma.includes(caption_text)) caption_text = '';

        // write request
        const requests = [
            this.request_set_text(caption_text),
        ];
        if (same) {
            requests.push(this.request_restart());
        } else {
            requests.push(this.request_set_file(file));
        }
        requests.push(this.request_play());

        // wait for playback to end
        const promise = new Promise((resolve)=>{
            let done = false;
            let timeout;
            async function end() {
                if (done) return;
                clearInterval(timeout);
                done = true;
                await self.obs.callBatch([
                    self.request_set_text(''),
                    self.request_stop(),
                ]);
                print('done');
                resolve();
            }

            // listen for end events
            self.once('playback_end', end);
            // polling fallback
            timeout = setInterval(async ()=>{
                const state = await self.get_state();
                print(state);
                if (state == PAUSED || state == STOPPED || state == ENDED) end();
            }, 1000);
        });

        // start playback
        setTimeout(async ()=>await this.obs.callBatch(requests), 20);

        return promise
    }

    request_restart() {
        return {
            requestType: 'TriggerMediaInputAction',
            requestData: {
                inputName: this.config.OBS_SOURCE_NAME,
                mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART',
            },
        }
    }

    request_play() {
        return {
            requestType: 'TriggerMediaInputAction',
            requestData: {
                inputName: this.config.OBS_SOURCE_NAME,
                mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PLAY',
            },
        }
    }

    request_pause() {
        return {
            requestType: 'TriggerMediaInputAction',
            requestData: {
                inputName: this.config.OBS_SOURCE_NAME,
                mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PAUSE',
            },
        }
    }

    request_stop() {
        return {
            requestType: 'TriggerMediaInputAction',
            requestData: {
                inputName: this.config.OBS_SOURCE_NAME,
                mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP',
            },
        }
    }

    request_set_text(text) {
        return {
            requestType: 'SetInputSettings',
            requestData: {
                inputName: this.config.OBS_TEXT_SOURCE_NAME,
                inputSettings: { text },
            }
        }
    }

    request_set_file(file) {
        return {
            requestType: 'SetInputSettings',
            requestData: {
                inputName: this.config.OBS_SOURCE_NAME,
                inputSettings: { local_file: file },
            }
        }
    }
}

export class OBSQueue extends OBSController {
    constructor (config) {
        super(config);
        this.queue = [];
        this.lock = false;
    }

    async play(files) {
        this.queue.push(...files);
        this.play_from_queue();
    }

    async play_from_queue() {
        if (this.lock) return;
        this.lock = true;
        while(this.queue.length) {
            const next = this.queue.shift();
            try {
                await this.play_async(next);
            } catch (err) {
                console.warn(err);
            }
        }
        this.lock = false;
    }
}