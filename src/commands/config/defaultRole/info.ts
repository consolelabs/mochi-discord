import {
  Command,
} from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"
import ChannelLogger from "utils/ChannelLogger"
import { BotBaseError } from "errors"

const command: Command = {
  id: "defaultrole_info",
  command: "info",
  brief: "Show current default role for newcomers",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    let description = ""
    const args = getCommandArguments(msg)

    if (args.length !== 2) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              usage: `${PREFIX}dr info`,
              examples: `${PREFIX}dr info`,
            }),
          ],
        },
      }
    }

    try {
      const json = await config.getCurrentDefaultRole(msg.guild.id)
      if (json.success) {
        description = `Current default role for newcomers is <@&${json.data.role_id}>`
      }
    } catch (error) {
      ChannelLogger.log(error as BotBaseError)
      description = "No default role configuration."
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
          usage: `${PREFIX}dr info`,
          examples: `${PREFIX}dr info`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
}

export default command
