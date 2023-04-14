import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { getEmoji } from "utils/common"
import { PREFIX, SALE_TRACKER_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { handleSalesTrack } from "./processor"

const command: Command = {
  id: "sales_track",
  command: "track",
  brief: "Setup a sales tracker for an NFT collection",
  category: "Community",
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    const args = getCommandArguments(msg)
    const { isChannel, value: channelId } = parseDiscordToken(args[2])
    if (!isChannel) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              title: "Invalid channel",
              description: `Your channel is invalid. Make sure that the channel exists, or that you have entered it correctly.\n${getEmoji(
                "ANIMATED_POINTING_RIGHT",
                true
              )} Type # to see channel list.\n${getEmoji(
                "ANIMATED_POINTING_RIGHT",
                true
              )} To add a new channel: 1. Create channel → 2. Confirm`,
            }),
          ],
        },
      }
    }

    const chan = await msg.guild.channels.fetch(channelId).catch(() => null)
    const addr = args[3]
    const platform = args[4]
    return await handleSalesTrack(
      msg,
      addr,
      platform,
      msg.guildId,
      chan ? chan.id : ""
    )
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}sales track <channel> <address> <chain_id>\n${PREFIX}sales track <channel> <address> <chain_symbol>`,
        examples: `${PREFIX}sales track #general 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73 250\n${PREFIX}sales track #general 0x343f999eAACdFa1f201fb8e43ebb35c99D9aE0c1 eth`,
        document: `${SALE_TRACKER_GITBOOK}&action=track`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Marketplace",
  minArguments: 5,
}

export default command
