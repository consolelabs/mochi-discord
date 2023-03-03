import Config from "adapters/config"
import { APIError, GuildIdNotFoundError } from "errors"
import { list } from "../processor"
import { Command } from "types/common"
import { PREFIX, TOKEN_ROLE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { msgColors } from "utils/common"

const command: Command = {
  id: "tr_list",
  command: "list",
  brief: "List all the token role setup",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const res = await Config.getConfigTokenRoleList(msg.guildId)
    if (!res.ok) {
      throw new APIError({
        msgOrInteraction: msg,
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
            color: msgColors.PINK,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tr list`,
        examples: `${PREFIX}tr list`,
        document: `${TOKEN_ROLE_GITBOOK}&action=list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
