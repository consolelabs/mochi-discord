import config from "adapters/config"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"

const command: Command = {
  id: "log_set",
  command: "set",
  brief: "Set logging channel to monitor guild members' activities",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const channelArg = args[2]
    if (!channelArg.startsWith("<#") || !channelArg.endsWith(">")) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Invalid channel" })],
        },
      }
    }

    const logChannel = channelArg.substring(2, channelArg.length - 1)
    const chan = await msg.guild.channels
      .fetch(logChannel)
      .catch(() => undefined)
    if (!chan)
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Channel not found" })],
        },
      }

    await config.updateGuild({ guildId: msg.guildId, logChannel })

    const embed = getSuccessEmbed({
      msg,
      title: msg.guild.name,
      description: `Successfully set <#${logChannel}> as log channel`,
    })
    return { messageOptions: { embeds: [embed] } }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}log set <channel>`,
        examples: `${PREFIX}log set #log-channel`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 3,
}

export default command
