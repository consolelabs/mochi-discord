import config from "adapters/config"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"

const command: Command = {
  id: "log_info",
  command: "info",
  brief: "Show current log channel's info",
  category: "Config",
  onlyAdministrator: true,
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
    const guild = await config.getGuild(msg.guildId)
    if (!guild) {
      throw new Error(`Guild ${msg.guildId} not found`)
    }
    if (!guild.log_channel) {
      const embed = composeEmbedMessage(msg, {
        author: [msg.guild.name, msg.guild.iconURL() ?? ""],
        description: `No logging channel configured for this guild.\nSet one with \`${PREFIX}log set <channel>.\``,
      })
      return { messageOptions: { embeds: [embed] } }
    }

    const embed = composeEmbedMessage(msg, {
      author: [msg.guild.name, msg.guild.iconURL() ?? ""],
      description: `Current monitoring channel is <#${guild.log_channel}>.\nYou can update using \`${PREFIX}log set <channel>.\``,
    })
    return { messageOptions: { embeds: [embed] } }
  },
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
