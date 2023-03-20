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
import { SendActivityMsg } from "utils/activity"

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

    const embed = getSuccessEmbed({
      msg,
      title: "Successfully set!",
      description: `<#${logChannel}> is now being monitored.`,
    })

    // send activity
    const dataProfile = await profile.getByDiscord(msg!.author.id)
    if (dataProfile.err) {
      throw new APIError({
        msgOrInteraction: msg,
        description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
        curl: "",
      })
    }
    const kafkaMsg: KafkaQueueActivityDataCommand = {
      platform: "discord",
      activity: {
        profile_id: dataProfile.id,
        status: MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
        platform: MOCHI_APP_SERVICE,
        action: MOCHI_ACTION_LOG,
        content: {
          username: "",
          amount: "",
          token: "",
          server_name: "",
          number_of_user: "",
          role_name: "",
          channel_name: chan!.name,
          token_name: "",
          moniker_name: "",
          address: "",
        },
      },
    }
    SendActivityMsg(kafkaMsg)
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
