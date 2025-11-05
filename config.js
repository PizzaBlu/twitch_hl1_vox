import fs from 'fs';
import path from 'path';
import ini from 'ini';

export function get_config() {
    const CONFIG_PATH = path.join(process.cwd(), 'config.ini');
    const defaultConfig = {
        CHANNEL: '',
        PATH: '',
        
        OBS_SOURCE_NAME: 'hl1_vox',
        OBS_TEXT_SOURCE_NAME: 'hl1_vox_text',
        OBS_HOST: 'ws://127.0.0.1:4455',
        OBS_PASSWORD: '',

        COMMAND: '!vox',
        BLACKLIST: 'vox_login',
        START_MESSAGE: 'doop _comma activated',
        DEEOOO_REPLACE: '⚠',

        COOLDOWN: 10000,
    };

    if (!fs.existsSync(CONFIG_PATH)) {
        const defaultIni = ini.encode(defaultConfig, { whitespace: true });
        fs.writeFileSync(CONFIG_PATH, defaultIni);
        console.log('');
        console.log('created config.ini')
        console.log('');
        return false;
    }

    const config = ini.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    return config;
}