import { CommandInteraction, Message } from "discord.js"
import { defaultEmojis } from "utils/common"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import Config from "../../../adapters/config"

export async function handleTokenDefault(
  msg: Message | CommandInteraction,
  symbol: string
) {
  if (!msg.guildId) {
    return {
      embeds: [
        getErrorEmbed({
          description: "This command must be run in a Guild",
        }),
      ],
    }
  }
  const req = {
    guild_id: msg.guildId,
    symbol,
  }
  try {
    const { ok, status } = await Config.setDefaultToken(req)
    if (!ok && status === 404) {
      return {
        embeds: [
          getErrorEmbed({
            description: `\`${symbol}\` hasn't been supported.\n${defaultEmojis.POINT_RIGHT} Please choose one in our supported \`$token list\`\n${defaultEmojis.POINT_RIGHT} To add your token, run \`$token add\`.`,
          }),
        ],
      }
    }
  } catch (e) {
    const err = (e as string)?.split("Error:")[1]
    let description = `${err}`
    if (err.includes("not supported")) {
      const supportedChains = await Config.getAllChains()
      description =
        description +
        `\nAll suppported chains by Mochi\n` +
        supportedChains
          .map((chain: { currency: string }) => {
            return `**${chain.currency}**`
          })
          .join("\n")
      return {
        embeds: [getErrorEmbed({ description: description })],
      }
    }
    const supportedTokens = await Config.getAllCustomTokens(msg.guildId)
    description =
      description +
      `\nAll suppported tokens by Mochi\n` +
      supportedTokens
        .map((token) => {
          return `**${token.symbol.toUpperCase()}**`
        })
        .join("\n")
    return {
      embeds: [getErrorEmbed({ description: description })],
    }
  }

  return {
    embeds: [
      composeEmbedMessage(null, {
        description: `Successfully set **${symbol.toUpperCase()}** as default token for server`,
      }),
    ],
  }
}
