import config from "adapters/config"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { APIError } from "errors"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import profile from "adapters/profile"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_LOG,
  MOCHI_APP_SERVICE,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { sendActivityMsg, defaultActivityMsg } from "utils/activity"
import defi from "adapters/defi"

const command: Command = {
  id: "log_set",
  command: "set",
  brief: "Configure a new log channel",
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
    const args = getCommandArguments(msg)
    const channelArg = args[2]
    if (!channelArg.startsWith("<#") || !channelArg.endsWith(">")) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "Invalid channel. Type # then choose the valid one!",
            }),
          ],
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
    await defi.createConfigNofityTransaction({
      guild_id: msg.guildId,
      channel_id: logChannel,
      token: "all",
    })

    const embed = getSuccessEmbed({
      msg,
      title: "Successfully set!",
      description: `<#${logChannel}> is now being monitored.`,
    })

    // send activity
    const dataProfile = await profile.getByDiscord(msg?.author.id)
    if (dataProfile.err) {
      throw new APIError({
        msgOrInteraction: msg,
        description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
        curl: "",
      })
    }
    const kafkaMsg: KafkaQueueActivityDataCommand = defaultActivityMsg(
      dataProfile.id,
      MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
      MOCHI_APP_SERVICE,
      MOCHI_ACTION_LOG
    )
    kafkaMsg.activity.content.channel_name = chan?.name
    sendActivityMsg(kafkaMsg)
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
