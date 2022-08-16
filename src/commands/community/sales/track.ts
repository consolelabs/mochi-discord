import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import {
  getErrorEmbed,
  composeEmbedMessage,
  getSuccessEmbed,
} from "utils/discordEmbed"
import community from "adapters/community"
import { InvalidInputError } from "errors"

const command: Command = {
  id: "track_sales",
  command: "track",
  brief: "Setup a sales tracker for an NFT collection",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const channelArg = args[2]
    if (
      !channelArg ||
      !channelArg.startsWith("<#") ||
      !channelArg.endsWith(">")
    ) {
      throw new InvalidInputError({ message: msg })
    }

    const channelId = channelArg.slice(2, channelArg.length - 1)
    const chan = await msg.guild.channels.fetch(channelId).catch(() => null)
    if (!chan) throw new InvalidInputError({ message: msg })
    const addr = args[3]
    if (!addr) throw new InvalidInputError({ message: msg })
    const platform = args[4]
    if (!platform) throw new InvalidInputError({ message: msg })
    const guildId = msg.guild.id

    const res = await community.createSalesTracker(
      addr,
      platform,
      guildId,
      channelId
    )

    if (res.error) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: res.error,
            }),
          ],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: "Tracker mode ON",
            description: `Tracker set, new NFT sales will be posted in <#${channelId}>. To add more collection, just re-run this command`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}sales track <channel> <address> <chain_id>`,
        examples: `${PREFIX}sales track #general 0x33910F98642914A3CB0dB10f0 250`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Marketplace",
  minArguments: 5,
}

export default command
