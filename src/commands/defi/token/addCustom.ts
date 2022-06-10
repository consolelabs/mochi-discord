import { Message } from "discord.js"
import { DiscordWalletTransferError } from "errors/DiscordWalletTransferError"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { defaultEmojis } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import Config from "../../../adapters/config"
import Defi from "../../../adapters/defi"

async function add(msg: Message, args: string[]) {
  const [, , address, symbol, chain] = args
  const req = {
    guild_id: msg.guildId,
    symbol,
    address,
    chain,
  }
  const resp = await Config.addToken(req)
  if (resp !== 200) {
    const errMsgByStatus = {
      400: "Unsupport Token",
      500: "Something went wrong! Please try again or contact administrators",
    }
    const defaultErrMsg = "Unsupport Token"
    throw new DiscordWalletTransferError({
      discordId: msg.author.id,
      guildId: msg.guildId,
      message: msg,
      errorMsg: (errMsgByStatus as any)[resp] || defaultErrMsg,
    })
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
    if (args.length !== 5) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }
    const symbol = args[3]
    const tokens = await Defi.getSupportedTokens()
    const isExisted = tokens.map((v) => v.symbol).includes(symbol.toUpperCase())
    if (isExisted) {
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
    }

    const embeds = await add(msg, args)
    return {
      messageOptions: {
        ...embeds,
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens add-custom <address> <symbol> <chain>`,
        examples: `${PREFIX}tokens add-custom 0x123 cake bsc`,
      }),
    ],
  }),
  canRunWithoutAction: true,
}

export default command
