import {
  Message,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { Command } from "types/common"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import { PREFIX } from "utils/constants"
import {
  composeDiscordExitButton,
  composeDiscordSelectionRow,
  composeEmbedMessage,
  getErrorEmbed,
} from "utils/discordEmbed"
import Config from "../../../adapters/config"

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const symbol = interaction.values[0]

  await Config.updateTokenConfig({
    guild_id: message.guildId,
    symbol,
    active: false,
  })

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(message, {
          description: `Successfully removed **${symbol.toUpperCase()}** from server's tokens list.`,
        }),
      ],
      components: [],
    },
  }
}

const command: Command = {
  id: "remove_server_token",
  command: "remove",
  brief: "Remove a token from your server's list",
  onlyAdministrator: true,
  category: "Community",
  run: async function (msg) {
    const gTokens = await Config.getGuildTokens(msg.guildId)
    if (!gTokens || !gTokens.length)
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: `Your server has no tokens.\nUse \`${PREFIX}token add\` to add one to your server.`,
            }),
          ],
        },
      }
    const options: MessageSelectOptionData[] = gTokens.map((token) => ({
      label: `${token.name} (${token.symbol})`,
      value: token.symbol,
    }))

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
              "Select to remove one of the following tokens from your server.",
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
        usage: `${PREFIX}tokens remove`,
        examples: `${PREFIX}tokens remove`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["rm"],
  colorType: "Defi",
}

export default command
