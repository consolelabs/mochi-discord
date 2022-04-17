# Mochi Bot

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
