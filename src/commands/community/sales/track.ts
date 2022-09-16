import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { PREFIX, SALE_TRACKER_GITBOOK } from "utils/constants"
import {
  getErrorEmbed,
  composeEmbedMessage,
  getSuccessEmbed,
} from "utils/discordEmbed"
import community from "adapters/community"

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
    const { isChannel, id: channelId } = parseDiscordToken(args[2])
    if (!isChannel) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "Invalid channel. Please choose another one!",
            }),
          ],
        },
      }
    }

    const chan = await msg.guild.channels.fetch(channelId).catch(() => null)
    if (!chan)
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Channel not found" })],
        },
      }
    const addr = args[3]
    if (!addr)
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Address not found" })],
        },
      }
    const platform = args[4]
    if (!platform)
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Platform not found" })],
        },
      }
    const guildId = msg.guild.id

    const res = await community.createSalesTracker(
      addr,
      platform,
      guildId,
      channelId
    )

    if (!res.ok) {
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
            title: "Tracker set!",
            description: `New NFT sales information will be posted in <#${channelId}>. To add more collection, just re-run this command.`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}sales track <channel> <address> <chain_id>`,
        examples: `${PREFIX}sales track #general 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73 250\n${PREFIX}sales track #general 0x343f999eAACdFa1f201fb8e43ebb35c99D9aE0c1 eth`,
        document: SALE_TRACKER_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Marketplace",
  minArguments: 5,
}

export default command
