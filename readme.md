# twitch hl1 vox
Let your viewers use the Half Life 1 VOX announcer to talk on stream.

![screenshot](/media/screenshot.png)

### Disclaimers
- I threw this together in a few hours, it's not perfect
- You need to provide your own copy of the VOX sound files
- Requires OBS
- Only tested on windows (should work on any platform).

## Getting Started

- Installing
    - Make sure you have [NodeJS](nodejs.org) installed
    - Clone this repo and cd into it
    - run `npm install` to install dependancies
- OBS
    - Enable Websockets in `tools > Websocket Server Settings`
    - Create an OBS Text Source for the vox subtitles
    - Create an OBS Media Source for the vox audio
        - Ensure loop is disabled
        - If you want to hear the VOX: change `Monitor off` to `Monitor and Output` for this source in the advanced audio properties window
        - You may also want to change hardware decoding and close file when inactive
- Configuration
    - Run `npm run start` to create config file
    - Edit `config.ini` (see table)

### Running
`npm run start` to run the bot

### config.ini
key             | what do I put there?              | default
----------------|-----------------------------------|-------------
CHANNEL         | your twitch channel name          |
PATH            | location of vox audio files       |
COMMAND         | command prefix                    | `!vox`
COOLDOWN        | how often vox can be used         | `10000`
BLACKLIST       | banned words                      | `vox_login`
OBS_SOURCE_NAME | source to play audio files from   | `hl1_vox`
OBS_TEXT_SOURCE_NAME | text source to write words to | `hl1_vox_text`
OBS_HOST        | obs websocket server address      | `ws://127.0.0.1:4455`
OBS_PASSWORD    | obs websocket server password     |
START_MESSAGE   | If the bot's first word is the same as the last word played in obs it will break. `START_MESSAGE` can help prevent this issue. If this happens you can manually restart the source in OBS.      | `doop _comma activated`
DEEOOO_REPLACE | symbol to use in place of sounds like `deeoo` | `⚠`

# Words
There are 616 sound files in the vox folder for hl1. **[Complete list](./vox_words.md)**
### Special Sounds
- `deeoo` `dadeda` `doop`
- `bizwarn` `buzwarn`
- `,` `_comma`
- `.` `_period`