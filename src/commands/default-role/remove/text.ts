import { Command } from "types/common"
import { DEFAULT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"
import Config from "adapters/config"
import { APIError, GuildIdNotFoundError, InternalError } from "errors"
import { handle } from "../processor"

const command: Command = {
  id: "defaultrole_remove",
  command: "remove",
  brief: "Remove default role for newcomers",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guildId || !msg.guild) {
      throw new GuildIdNotFoundError({})
    }
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
        throw new InternalError({
          msgOrInteraction: msg,
          title: "No default role found",
          description: `You haven't set any default role yet. To set a new one, run \`\`\`$dr set @<role_name>\`\`\`\n You can remove it later using \`$dr remove\`.`,
        })
      }
    } else {
      throw new APIError({
        msgOrInteraction: msg,
        error: configs.error,
        description: configs.log,
        curl: configs.curl,
      })
    }

    const res = await config.removeDefaultRoleConfig(msg.guildId)
    if (!res.ok) {
      throw new APIError({
        msgOrInteraction: msg,
        error: res.error,
        description: res.log,
        curl: res.curl,
      })
    }

    return handle(msg, "Default role removed")
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
