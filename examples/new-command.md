# Create new command

Example command: Command for setting log channel `$<command> <action> [options]`. Can refer to `/src/commands/config/log`

- $log set #genneral -> config general for log message
- $log info -> show channel config

`1. Index file`

- Create actions for new command

```
const actions: Record<string, Command> = {
  set,
  info,
}
```

- Create new object type Command from `/types/common.ts`
- Request Product team to create gitbook link
- Create TEST_CHANNEL_GITBOOK in `/utils/constants.ts` with gitbook fromProduct team
- Add `helpMessage` for user
- Add `actions` to command

```
const command: Command = {
    id: "test",
    command: "test",
    brief: "This is test command for newcomers",
    category: "Newcomers",
    onlyAdministrator: true,
    run: async() => null,
    getHelpMessage: async(msg) => ({
        embeds: [
            composeEmbedMessage(msg, {
                includeCommandsList: true,
                usage: `${PREFIX}test <action>`,
                description:
                "Configure a test channel to monitor guild members' activities",
                footer: [`Type ${PREFIX}help test <action> for a specific action!`],
                document: TEST_CHANNEL_GITBOOK,
                title: "Test channel",
                examples: `${PREFIX}test set`,
            })
        ]
    }),
    actions,
}
```

`2. Action file`

- Create new object type Command from `/types/common.ts`
- Add `helpMessage` for user

```
const command: Command = {
    id: "test_create",
    command: "set",
    brief: "Create test command for newcomers",
    category: "Newcomers",
    onlyAdministrator: true,
    run: async function(msg) => {
        // logic set test command here
    },
    getHelpMessage: async (msg) => ({
        embeds: [
            composeEmbedMessage(msg, {
                usage: `${PREFIX}test set <channel>`,
                examples: `${PREFIX}test set #general`,
            }),
        ],
    }),
    canRunWithoutAction: true,
}
```
