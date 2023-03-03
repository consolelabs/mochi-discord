import {
  CommandInteraction,
  Message,
  MessageOptions,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { MultipleResult, RunResult } from "types/common"
import { InternalError, GuildIdNotFoundError, APIError } from "errors"
import { Token } from "types/defi"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import { InteractionHandler } from "handlers/discord/select-menu"
import Config from "../../../adapters/config"
import Defi from "../../../adapters/defi"
import * as SelectMenuUtil from "ui/discord/select-menu"
import * as ButtonUtil from "ui/discord/button"

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
  const { data: gTokens, ok, curl, log } = await Config.getGuildTokens(guildId)
  if (!ok) {
    throw new APIError({ curl, description: log })
  }
  let options: MessageSelectOptionData[] = tokens
    .filter((t) => !gTokens.map((gToken: Token) => gToken.id).includes(t.id))
    .map((token) => ({
      label: `${token.name} (${token.symbol})`,
      value: token.symbol,
    }))

  if (!options.length)
    throw new InternalError({
      msgOrInteraction: msg,
      description: "Your server already had all supported tokens.",
    })
  if (options.length > 25) {
    options = options.slice(0, 25)
  }

  const selectionRow = SelectMenuUtil.composeDiscordSelectionRow({
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
      components: [selectionRow, ButtonUtil.composeDiscordExitButton(authorId)],
    },
    interactionOptions: {
      handler,
    },
  }
}
