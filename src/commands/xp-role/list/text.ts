import Config from "adapters/config"
import { APIError, GuildIdNotFoundError } from "errors"
import { list } from "../processor"
import { Command } from "types/common"
import { PREFIX, XP_ROLE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"

const command: Command = {
  id: "xr_list",
  command: "list",
  brief: "List all the xp role setup",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const res = await Config.getConfigXPRoleList(msg.guildId)
    if (!res.ok) {
      throw new APIError({
        message: msg,
        curl: res.curl,
        description: res.log,
      })
    }

    const { title, description } = list(res)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: [title],
            description,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}xr list`,
        examples: `${PREFIX}xr list`,
        document: `${XP_ROLE_GITBOOK}&action=list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
