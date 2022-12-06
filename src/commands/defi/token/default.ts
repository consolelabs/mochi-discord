import { CommandInteraction, Message } from "discord.js"
import { CommandArgumentError } from "errors"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
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
    await Config.setDefaultToken(req)
  } catch (e) {
    const err = (e as string).split("Error:")[1]
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

const command: Command = {
  id: "set_default_token",
  command: "default",
  brief: "Set default token for your server",
  category: "Community",
  onlyAdministrator: true,
  run: async function (msg) {
    const args = getCommandArguments(msg)
    if (args.length < 3) {
      throw new CommandArgumentError({
        message: msg,
        getHelpMessage: () => command.getHelpMessage(msg),
      })
    }
    const embeds = await handleTokenDefault(msg, args[2])
    return {
      messageOptions: {
        ...embeds,
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens default <symbol>`,
        examples: `${PREFIX}tokens default cake`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
