import {
  CommandInteraction,
  Message,
  MessageOptions,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { InternalError, GuildIdNotFoundError } from "errors"
import { Command, MultipleResult, RunResult } from "types/common"
import { PREFIX } from "utils/constants"
import {
  composeDiscordExitButton,
  composeDiscordSelectionRow,
  composeEmbedMessage,
  getSuccessEmbed,
} from "utils/discordEmbed"
import { InteractionHandler } from "utils/InteractionManager"
import Config from "../../../adapters/config"
import Defi from "../../../adapters/defi"

const handler: InteractionHandler = async (msgOrInteraction) => {
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

export async function handleTokenAdd(
  msg: Message | CommandInteraction,
  guildId: string,
  authorId: string
): Promise<
  RunResult<MessageOptions> | MultipleResult<Message | CommandInteraction>
> {
  const tokens = await Defi.getSupportedTokens()
  const gTokens = (await Config.getGuildTokens(guildId)) ?? []
  let options: MessageSelectOptionData[] = tokens
    .filter((t) => !gTokens.map((gToken) => gToken.id).includes(t.id))
    .map((token) => ({
      label: `${token.name} (${token.symbol})`,
      value: token.symbol,
    }))

  if (!options.length)
    throw new InternalError({
      message: msg,
      description: "Your server already had all supported tokens.",
    })
  if (options.length > 25) {
    options = options.slice(0, 25)
  }

  const selectionRow = composeDiscordSelectionRow({
    customId: "guild_tokens_selection",
    placeholder: "Make a selection",
    options,
  })

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: "Need action",
          description:
            "Select to add one of the following tokens to your server.",
        }),
      ],
      components: [selectionRow, composeDiscordExitButton(authorId)],
    },
    interactionOptions: {
      handler,
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
    return await handleTokenAdd(msg, msg.guildId, msg.author.id)
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
