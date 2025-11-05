import fs from 'fs';
import path from 'path';

export function get_vox_words(dir, blacklist=[]) {
    const rename = (fname) => [path.parse(fname).name, path.join(dir, fname)];
    const skipwords = (arr) => !blacklist.includes(arr[0]);
    const files = Object.fromEntries(fs.readdirSync(dir).map(rename).filter(skipwords));
    return files;
}