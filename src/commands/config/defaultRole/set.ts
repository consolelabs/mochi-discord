import {
  Command,
  DefaultRoleEvent,
} from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"
import ChannelLogger from "utils/ChannelLogger"
import { BotBaseError } from "errors"

const command: Command = {
  id: "defaultrole_set",
  command: "set",
  brief: "Configure a default role for newcomers",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    let description = ""
    const args = getCommandArguments(msg)

    if (args.length !== 3) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              usage: `${PREFIX}dr set @<role_name>`,
              examples: `${PREFIX}dr set @Visitor`,
            }),
          ],
        },
      }
    }

    const requestData: DefaultRoleEvent = {
      guild_id: msg.guild.id,
      role_id: args[2].replace(/\D/g, ""),
    }

    try {
      const res = await config.configureDefaultRole(requestData)
      if (res.success) {
        description = `Role <@&${requestData.role_id}> is now configured as newcomer's default role`
      }
    } catch (error) {
      ChannelLogger.log(error as BotBaseError)
      description = `Role <@&${requestData.role_id}> has already been configured, please try to set another one`
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Default Role",
            description,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}dr set @<role_name>`,
          examples: `${PREFIX}dr set @Visitor`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
}

export default command
