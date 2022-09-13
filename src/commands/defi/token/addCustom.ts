import { Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import Config from "../../../adapters/config"

async function add(msg: Message, args: string[]) {
  if (!msg.guildId) {
    return {
      embeds: [
        getErrorEmbed({
          msg,
          description: "This command must be run in a Guild",
        }),
      ],
    }
  }
  const [, , address, symbol, chain] = args
  const req = {
    guild_id: msg.guildId,
    symbol,
    address,
    chain,
  }
  try {
    await Config.addToken(req)
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
        embeds: [getErrorEmbed({ msg: msg, description: description })],
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
      embeds: [getErrorEmbed({ msg: msg, description: description })],
    }
  }

  return {
    embeds: [
      composeEmbedMessage(msg, {
        description: `Successfully added **${symbol.toUpperCase()}** to server's token lists`,
      }),
    ],
  }
}

const command: Command = {
  id: "add_custom_server_token",
  command: "add-custom",
  brief: "Add a token to your server's list",
  category: "Community",
  onlyAdministrator: true,
  run: async function (msg) {
    const args = getCommandArguments(msg)
    return {
      messageOptions: {
        ...(await add(msg, args)),
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens add-custom <address> <symbol> <chain>`,
        examples: `${PREFIX}tokens add-custom 0x22c36BfdCef207F9c0CC941936eff94D4246d14A BACC eth\n${PREFIX}token add-custom 0xFBde54764f51415CB0E00765eA4383bc90EDCCE8 LB eth`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 5,
  aliases: ["addcustom"],
}

export default command
