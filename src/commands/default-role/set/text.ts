import { Command, DefaultRoleEvent } from "types/common"
import { DEFAULT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { APIError, GuildIdNotFoundError, InternalError } from "errors"
import { getEmoji } from "utils/common"
import { handle } from "../processor"
import profile from "adapters/profile"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_DEFAULTROLE,
  MOCHI_APP_SERVICE,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { SendActivityMsg } from "utils/activity"

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
        msgOrInteraction: msg,
        title: "Invalid roles",
        description: `Your role is invalid. Make sure that role exists, or that you've entered it correctly.\n\n${getEmoji(
          "POINTINGRIGHT"
        )} Type \`@\` to see a role list.\n${getEmoji(
          "POINTINGRIGHT"
        )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role`,
      })
    }

    // if it's id then check if that role exist
    const role = await msg.guild?.roles.fetch(id).catch(() => null)
    if (isId) {
      if (!role) {
        throw new InternalError({
          msgOrInteraction: msg,
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
        msgOrInteraction: msg,
        description: res.log,
        curl: res.curl,
      })
    }

    // send activity
    const dataProfile = await profile.getByDiscord(msg.author.id)
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
        action: MOCHI_ACTION_DEFAULTROLE,
        content: {
          username: "",
          amount: "",
          token: "",
          server_name: "",
          number_of_user: "",
          role_name: role!.name,
          channel_name: "",
          token_name: "",
          moniker_name: "",
          address: "",
        },
      },
    }
    SendActivityMsg(kafkaMsg)
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
