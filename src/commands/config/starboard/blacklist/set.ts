import config from "adapters/config"
import { Message } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { BlacklistChannelRepostConfigRequest, Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"

const command: Command = {
  id: "starboard_blacklist_set",
  command: "set",
  brief: "Set channel to blacklist cannot bookmark",
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
              description:
                "Cannot find a channel that match to your input channel ID.",
            }),
          ],
        },
      }
    }
    const req: BlacklistChannelRepostConfigRequest = {
      guild_id: msg.guild.id,
      channel_id: value,
    }
    const { ok, log, curl } = await config.setBlacklistChannelRepostConfig(req)
    if (!ok) {
      throw new APIError({ message: msg, curl, description: log })
    }
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Starboard Blacklist Channel Configuration",
            description: `Any reactions in channel <#${value}> will not be reposted.`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}sb blacklist set <channel>`,
          examples: `${PREFIX}sb blacklist set #secret`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 4,
}

export default command
