import { Message } from "discord.js"
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
  await Config.addToken(req)
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
