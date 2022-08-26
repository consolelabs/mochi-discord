import {
  Message,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { Command } from "types/common"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import { defaultEmojis } from "utils/common"
import { PREFIX } from "utils/constants"
import {
  composeDiscordExitButton,
  composeDiscordSelectionRow,
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
import Config from "../../../adapters/config"
import Defi from "../../../adapters/defi"

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const symbol = interaction.values[0]

  if (!message.guildId) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            msg: message,
            description: `Guild ID not found`,
          }),
        ],
        components: [],
      },
    }
  }

  await Config.updateTokenConfig({
    guild_id: message.guildId,
    symbol,
    active: true,
  })

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          msg: message,
          description: `Successfully added **${symbol.toUpperCase()}** to server's tokens list.`,
        }),
      ],
      components: [],
    },
  }
}

const command: Command = {
  id: "add_server_token",
  command: "add",
  brief: "Add a token to your server's list",
  category: "Community",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    const tokens = await Defi.getSupportedTokens()
    const gTokens = (await Config.getGuildTokens(msg.guildId)) ?? []
    const options: MessageSelectOptionData[] = tokens
      .filter((t) => !gTokens.map((gToken) => gToken.id).includes(t.id))
      .map((token) => ({
        label: `${token.name} (${token.symbol})`,
        value: token.symbol,
      }))

    if (!options.length)
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              title: `${defaultEmojis.ERROR} Command error`,
              description: "Your server already had all supported tokens.",
            }),
          ],
        },
      }

    const selectionRow = composeDiscordSelectionRow({
      customId: "guild_tokens_selection",
      placeholder: "Make a selection",
      options,
    })

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
      commandChoiceOptions: {
        userId: msg.author.id,
        messageId: msg.id,
        channelId: msg.channelId,
        guildId: msg.guildId,
        handler,
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens add`,
        examples: `${PREFIX}tokens add`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
}

export default command
