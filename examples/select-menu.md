# Select menu

1. Create selectionRow using discord embed `composeDiscordSelectionRow`

```
import { composeDiscordSelectionRow } from "discord/embed/ui"

const tokens: string[] = ["Bitcoin (BTC)", "Tether(USDT)", ...]
let options: MessageSelectOptionData[] = tokens

const selectionRow = composeDiscordSelectionRow({
    customId: "guild_tokens_selection",
    placeholder: "Make a selection",
    options,
})
```

2. Create handler for menu interaction using InteractionHandler from `utils/InteractionManager`

- Create interaction type SelectMenuInteraction
- Parse information from interaction

```
import { InteractionHandler } from "utils/InteractionManager"
import { SelectMenuInteraction } from "discord.js"

const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction

  // parse information from interaction
  const symbol = interaction.values[0]

  // logic handle interaction
  // ...

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          msg: message,
          description: `Success`,
        }),
      ],
      components: [],
    },
  }
}
```

3. Add to command

- Add selectionRow
- Add handler in interactionOptions

```
const command: Command = {
    id: "test_create",
    command: "set",
    brief: "Create test command for newcomers",
    category: "Newcomers",
    onlyAdministrator: true,
    run: async function(msg) => {
        // logic command
        // ...

        return {
            messageOptions: {
                embeds: [
                composeEmbedMessage(msg, {
                    title: "Need action",
                    description:
                    "Select to add one of the following tokens to your server.",
                }),
                ],
                components: [selectionRow, composeDiscordExitButton(msg.author.id)],
            },
            interactionOptions: {
                handler,
            },
        }
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
