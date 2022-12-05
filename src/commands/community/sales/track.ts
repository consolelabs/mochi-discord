import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { PREFIX, SALE_TRACKER_GITBOOK } from "utils/constants"
import { getErrorEmbed, composeEmbedMessage } from "utils/discordEmbed"
import community from "adapters/community"
import { emojis, getEmojiURL } from "utils/common"
import { APIError } from "errors"
import { CommandInteraction, Message } from "discord.js"

export async function handleSalesTrack(
  msg: Message | CommandInteraction,
  addr: string | null,
  platform: string | null,
  guildId: string,
  channelId: string | null
) {
  if (!channelId || !addr || !platform)
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: `${
              !channelId ? "Channel" : !addr ? "Address" : "Platform"
            } not found`,
          }),
        ],
      },
    }
  const res = await community.createSalesTracker(
    addr,
    platform,
    guildId,
    channelId
  )

  if (!res.ok) {
    throw new APIError({ message: msg, curl: res.curl, description: res.log })
  }

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Sales Tracker", getEmojiURL(emojis.LEADERBOARD)],
          description: `NFT sales information will be updated in <#${channelId}>.`,
        }),
      ],
    },
  }
}

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
              description: "Invalid channel. Please choose another one!",
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
