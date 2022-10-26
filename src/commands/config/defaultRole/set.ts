import { Command, DefaultRoleEvent } from "types/common"
import { DEFAULT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments, parseDiscordToken } from "utils/commands"

const command: Command = {
  id: "defaultrole_set",
  command: "set",
  brief: "Set a default role for newcomers",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guildId) {
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
    const { isRole, isId, value: id } = parseDiscordToken(args[2] ?? "")

    if (!isRole || !isId) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              title: "Invalid role",
              description:
                "The added role must be a valid one. Don’t be mistaken role with username while setting.",
            }),
          ],
        },
      }
    }

    const requestData: DefaultRoleEvent = {
      guild_id: msg.guildId,
      role_id: id,
    }

    const res = await config.configureDefaultRole(requestData)
    if (res.ok) {
      description = `<@&${requestData.role_id}> is now configured as newcomer's default role.`
    } else {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: res.error })],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({ msg, title: "Default role set", description }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}dr set @<role_name>`,
          description:
            "If you know what you're doing, this command also support passing in the role id (maybe you're a power user, maybe you don't want to alert all users that have that role, etc...)",
          examples: `${PREFIX}dr set @Visitor`,
          document: `${DEFAULT_ROLE_GITBOOK}&action=set`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 3,
}

export default command
