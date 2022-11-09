import config from "adapters/config"
import { Guild, Message } from "discord.js"
import { Command } from "types/common"
import { getEmojiURL, tripodEmojis } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"

export async function runLogInfo({
  msg,
  guild,
}: {
  msg?: Message
  guild?: Guild
}) {
  if (!guild?.id) {
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
  const guildCfg = await config.getGuild(guild.id)
  if (!guildCfg) {
    throw new Error(`Guild ${guild.id} not found`)
  }
  if (!guildCfg.log_channel) {
    const embed = composeEmbedMessage(msg, {
      author: ["Log channel", getEmojiURL(tripodEmojis.POD)],
      description: `No logging channel configured for this guild.\nSet one with \`${PREFIX}log set <channel>.\``,
    })
    return { messageOptions: { embeds: [embed] } }
  }

  const embed = composeEmbedMessage(msg, {
    author: ["Log channel", getEmojiURL(tripodEmojis.POD)],
    description: `All activities will be monitored in <#${guildCfg.log_channel}>. To change this channel, run \`$log set #<channel>\`.`,
    // description: `<#${guild.log_channel}> is currently monitored.\nTo change the monitored channel, run \`${PREFIX}log set <channel>.\``,
  })
  return { messageOptions: { embeds: [embed] } }
}

const command: Command = {
  id: "log_info",
  command: "info",
  brief: "Show current log channel's info",
  category: "Config",
  onlyAdministrator: true,
  run: (msg) => runLogInfo({ msg, guild: msg.guild ?? undefined }),
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}log info`,
        examples: `${PREFIX}log info`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
