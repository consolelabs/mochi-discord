import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import community from "adapters/community"
import { capFirst } from "utils/common"

const command: Command = {
  id: "sales_track",
  command: "track",
  brief: "Set a tracker for an NFT",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    if (args.length != 4) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }
    const addr = args[2]
    const platform = args[3]
    const guildId = msg.guild.id

    await community.createSalesTracker(addr, platform, guildId)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `Successfully tracked contract address ${addr} on platform ${capFirst(
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
        usage: `${PREFIX}sales track <address> <platform>`,
        examples: `${PREFIX}sales track 0x33910F98642914A3CB0dB10f0c0b062acA2eF552 ethereum`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Marketplace",
}

export default command
