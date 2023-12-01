import {
  Message,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { APIError } from "errors"
import { Token } from "types/defi"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import { InteractionHandler } from "handlers/discord/select-menu"
import Config from "../../../adapters/config"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { composeDiscordExitButton } from "ui/discord/button"

export const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const symbol = interaction.values[0]
  if (!message.guildId) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            msg: message,
            description: "This command must be run in a Guild",
          }),
        ],
      },
    }
  }

  await Config.updateTokenConfig({
    guild_id: message.guildId,
    symbol,
    active: false,
  })

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          msg: message,
          description: `Successfully removed **${symbol.toUpperCase()}** from server's tokens list.`,
        }),
      ],
      components: [],
    },
  }
}

export async function handleTokenRemove(guildId: string, authorId: string) {
  const {
    data: gTokens,
    ok,
    curl,
    log,
    status = 500,
    error,
  } = await Config.getGuildTokens(guildId)
  if (!ok) {
    throw new APIError({ curl, description: log, status, error })
  }
  if (!gTokens || !gTokens.length)
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: `Your server has no tokens.\nUse \`${PREFIX}token add\` to add one to your server.`,
          }),
        ],
      },
    }
  const options: MessageSelectOptionData[] = gTokens.map((token: Token) => ({
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
        composeEmbedMessage(null, {
          title: "Need action",
          description:
            "Select to remove one of the following tokens from your server.",
        }),
      ],
      components: [selectionRow, composeDiscordExitButton(authorId)],
    },
    interactionOptions: {
      handler,
    },
  }
}
