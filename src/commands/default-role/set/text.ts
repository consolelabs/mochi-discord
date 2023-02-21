import { Command, DefaultRoleEvent } from "types/common"
import { DEFAULT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { APIError, GuildIdNotFoundError, InternalError } from "errors"
import { getEmoji } from "utils/common"
import { handle } from "../processor"

const command: Command = {
  id: "defaultrole_set",
  command: "set",
  brief: "Set a default role for newcomers",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg: Message) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({})
    }
    const args = getCommandArguments(msg)
    const { isRole, isId, value: id } = parseDiscordToken(args[2] ?? "")

    if (!isRole && !isId) {
      throw new InternalError({
        message: msg,
        title: "Invalid roles",
        description: `Your role is invalid. Make sure that role exists, or that you've entered it correctly.\n\n${getEmoji(
          "POINTINGRIGHT"
        )} Type \`@\` to see a role list.\n${getEmoji(
          "POINTINGRIGHT"
        )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role`,
      })
    }

    // if it's id then check if that role exist
    if (isId) {
      const role = await msg.guild?.roles.fetch(id).catch(() => null)
      if (!role) {
        throw new InternalError({
          message: msg,
          title: "Invalid roles",
          description: `Your role is invalid. Make sure that role exists, or that you've entered it correctly.\n\n${getEmoji(
            "POINTINGRIGHT"
          )} Type \`@\` to see a role list.\n${getEmoji(
            "POINTINGRIGHT"
          )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role`,
        })
      }
    }

    const requestData: DefaultRoleEvent = {
      guild_id: msg.guildId,
      role_id: id,
    }

    const res = await config.configureDefaultRole(requestData)
    if (!res.ok) {
      throw new APIError({
        error: res.error,
        message: msg,
        description: res.log,
        curl: res.curl,
      })
    }

    return handle(msg, "Default role updated")
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}dr set <@role_name/roleID>`,
          title: "Setting a default role",
          description: `If you don't want to notify users when setting up the default role, you can use role ID instead of role name.\n\nNote: To get the roleID\n${getEmoji(
            "POINTINGRIGHT"
          )} _Go to Server Setting, and choose Roles_\n${getEmoji(
            "POINTINGRIGHT"
          )} _Select a role, and copy its ID_`,
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
