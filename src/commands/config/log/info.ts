import config from "adapters/config"
import { Message } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { emojis, getEmojiURL } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

export async function runLogInfo({
  msg,
  guildId,
}: {
  msg?: Message
  guildId?: string | null
}) {
  if (!guildId) {
    throw new GuildIdNotFoundError({ message: msg })
  }
  const guildCfg = await config.getGuild(guildId)
  if (!guildCfg) {
    throw new Error(`Guild ${guildId} not found`)
  }
  if (!guildCfg.log_channel) {
    const embed = composeEmbedMessage(msg, {
      author: ["Log channel", getEmojiURL(emojis.POD)],
      description: `No logging channel configured for this guild.\nSet one with \`${PREFIX}log set <channel>.\``,
    })
    return { messageOptions: { embeds: [embed] } }
  }

  const embed = composeEmbedMessage(msg, {
    author: ["Log channel", getEmojiURL(emojis.POD)],
    description: `All activities will be monitored in <#${guildCfg.log_channel}>. To change this channel, run \`$log set #<channel>\`.`,
  })
  return { messageOptions: { embeds: [embed] } }
}

const command: Command = {
  id: "log_info",
  command: "info",
  brief: "Show current log channel's info",
  category: "Config",
  onlyAdministrator: true,
  run: (msg) => runLogInfo({ msg, guildId: msg.guildId }),
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
