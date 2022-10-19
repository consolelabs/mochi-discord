import { Command } from "types/common"
import { DEFAULT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"
import Config from "adapters/config"

const command: Command = {
  id: "defaultrole_remove",
  command: "remove",
  brief: "Remove default role for newcomers",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
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
    let description = ""
    const args = getCommandArguments(msg)

    if (args.length !== 2) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              usage: `${PREFIX}dr remove`,
              examples: `${PREFIX}dr remove`,
              document: DEFAULT_ROLE_GITBOOK,
            }),
          ],
        },
      }
    }

    // not set default role yet but remove it
    const configs = await Config.getCurrentDefaultRole(msg.guildId)
    if (configs.ok) {
      if (configs.data.role_id == "") {
        return {
          messageOptions: {
            embeds: [
              getErrorEmbed({
                msg,
                description: `You haven't set any role. To config a new one, run \`$dr set @<role_name>\`.`,
              }),
            ],
          },
        }
      }
    } else {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: configs.error })],
        },
      }
    }

    const res = await config.removeDefaultRoleConfig(msg.guildId)
    if (res.ok) {
      description =
        "Existing users' role will not be affected\nHowever please **NOTE** that from now on new users joining your server won't have a default role anymore.\nTo set a new one, run `$dr set @<role_name>`"
    } else {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: res.error })],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [getSuccessEmbed({ msg, title: "Role removed", description })],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}dr remove`,
          examples: `${PREFIX}dr remove`,
          document: `${DEFAULT_ROLE_GITBOOK}&action=remove`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
