import {
  Message,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { CommandError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import { PREFIX } from "utils/constants"
import {
  composeDiscordExitButton,
  composeDiscordSelectionRow,
  composeEmbedMessage,
  getSuccessEmbed,
} from "utils/discordEmbed"
import Config from "../../../adapters/config"
import Defi from "../../../adapters/defi"

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const symbol = interaction.values[0]

  if (!message.guildId) {
    throw new GuildIdNotFoundError({ message: msgOrInteraction })
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
      throw new GuildIdNotFoundError({ message: msg })
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
      throw new CommandError({
        message: msg,
        description: "Your server already had all supported tokens.",
      })

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
