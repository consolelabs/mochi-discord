# Mochi Bot

## First time project setup

- Create your own Discord Application -> Discord Bot -> Install it to your dev server
- Install pkg needed for canvas if needed: `brew install pkg-config cairo pango libpng jpeg giflib librsvg`
- Set the env:

```
ENV='dev'

# Your Discord Bot token
DISCORD_TOKEN='...'

# A log channel id in your dev server
LOG_CHANNEL_ID='...'

WEBSITE_ENDPOINT=''

# Your server id - Needed to be added to the BE database for Mochi to recognize your dev server
MOCHI_GUILD_ID='...'

# FIRESTORE_KEY='...'
TWITTER_TOKEN='...'

# Point to prod BE
API_SERVER_HOST="https://develop-api.mochi.pod.town"
PT_API_SERVER_HOST="https://backend.pod.so"

# Whitelisted Tripod Channel ID - E.g. the server you use to test the bot on your dev server
GAME_TRIPOD_TEST_CHANNEL_ID='...'
GAME_TRIPOD_CHANNEL_IDS='...'
```

## Run project

Run postgres

```
docker-compose up -d
```

Change .env-sample file to .env, fill some required secrets

Install packages

```
make install
```

Run bot

```
make start
```

Run bot in dev mode (incremental build on file changes)

```
make dev
```

If you are developing locally & have the API pointed to the BE prod, make sure you comment out this line in the `messageCreate.ts` file:

```
await handleNormalMessage(message)
```

## Project components

```
        Discord                API
    ---------------          -------
    |             |             |
======================================
[commands] <-> [events]     [handlers]
    |             |             |
    └---------------------------┘
                  |
              [modules]

```

- commands: handle !neko commands on discord
- events: handle discord events
- modules: core objects used by components above
- adapters: create api call
- errors: define errors

## Credits

A big thank to all who contributed to this project!

If you'd like to contribute, please check out the [contributing guide](CONTRIBUTING.md) first.

[![Contributing](https://contrib.rocks/image?repo=consolelabs/mochi-discord)](https://github.com/consolelabs/mochi-discord/graphs/contributors)
