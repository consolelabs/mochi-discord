import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import community from "adapters/community"
import { capFirst } from "utils/common"
import { InvalidInputError } from "errors"

const command: Command = {
  id: "track_sales",
  command: "sales",
  brief: "Set a tracker for an NFT",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    if (args.length != 5) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }
    const channelArg = args[2]
    if (
      !channelArg ||
      !channelArg.startsWith("<#") ||
      !channelArg.endsWith(">")
    ) {
      throw new InvalidInputError({ message: msg })
    }

    const channelId = channelArg.slice(2, channelArg.length - 1)
    const chan = await msg.guild.channels
      .fetch(channelId)
      .catch(() => undefined)
    if (!chan) throw new InvalidInputError({ message: msg })
    const addr = args[3]
    const platform = args[4]
    const guildId = msg.guild.id

    await community.createSalesTracker(addr, platform, guildId, channelArg)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `Successfully configure ${channelArg} as sales update channel. Tracked contract address ${addr} on platform ${capFirst(
              platform
            )}.`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}track sales <channel> <address> <chain_id>`,
        examples: `${PREFIX}track sales #general 0x33910F98642914A3CB0dB10f0 250`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Marketplace",
}

export default command
