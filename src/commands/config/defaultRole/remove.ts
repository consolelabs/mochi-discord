import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"
import ChannelLogger from "utils/ChannelLogger"
import { BotBaseError } from "errors"

const command: Command = {
  id: "defaultrole_remove",
  command: "remove",
  brief: "Remove default role for newcomers",
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
              usage: `${PREFIX}dr remove`,
              examples: `${PREFIX}dr remove`,
            }),
          ],
        },
      }
    }

    try {
      const res = await config.removeDefaultRoleConfig(msg.guild.id)
      if (res.success) {
        description = "Successfully removed default role for newcomers."
      }
    } catch (error) {
      ChannelLogger.log(error as BotBaseError)
      description = "Failed to remove default role configuration."
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
          usage: `${PREFIX}dr remove`,
          examples: `${PREFIX}dr remove`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
