import config from "adapters/config"
import { Message } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { BlacklistChannelRepostConfigRequest, Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { defaultEmojis } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"

const command: Command = {
  id: "starboard_blacklist_remove",
  command: "remove",
  brief: "Remove channel from blacklist cannot bookmark",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg: Message) {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)
    const channelArg = args[3]
    const { isChannel, value } = parseDiscordToken(channelArg)
    const channel = await msg.guild?.channels.fetch(value)
    if (!isChannel || !channel) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              title: "Invalid channel",
              description: `Your channel is invalid. Make sure that the channel exists, or that you have entered it correctly.\n\n${defaultEmojis.POINT_RIGHT} Type \`#\` to see the channel list. \n${defaultEmojis.POINT_RIGHT} To add a new channel: 1. Create channel → 2. Confirm`,
            }),
          ],
        },
      }
    }
    const req: BlacklistChannelRepostConfigRequest = {
      guild_id: msg.guild.id,
      channel_id: value,
    }
    const { ok, log, curl } = await config.removeBlacklistChannelRepostConfig(
      req
    )
    if (!ok) {
      throw new APIError({ message: msg, curl, description: log })
    }
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Starboard Blacklist Channel Configuration",
            description: `Channel <#${value}> is now removed from blacklist.`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}sb blacklist remove <channel>`,
          examples: `${PREFIX}sb blacklist remove #secret`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 4,
}

export default command
