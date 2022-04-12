# Neko Bot

## Run project

Run postgres

```
docker-compose up -d
```

Migrate db

```
# up
make migrate-up
#down
make migrate-down
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
- handlers: api endpoints
- modules: core objects used by components above
