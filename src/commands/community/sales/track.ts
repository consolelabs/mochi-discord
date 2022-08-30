import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { PREFIX } from "utils/constants"
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
          embeds: [getErrorEmbed({ msg, description: "Invalid channel" })],
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
