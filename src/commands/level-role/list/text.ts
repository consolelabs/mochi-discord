import Config from "adapters/config"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { emojis, getEmojiURL } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { list } from "./processor"

const command: Command = {
  id: "lr_list",
  command: "list",
  brief: "List all active level roles",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const res = await Config.getGuildLevelRoleConfigs(msg.guildId)
    if (!res.ok) {
      throw new APIError({
        msgOrInteraction: msg,
        curl: res.curl,
        description: res.log,
      })
    }

    const { description, title } = list(res)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: [title, getEmojiURL(emojis.BADGE2)],
            description,
            color: "#FCD3C1",
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}lr list`,
        examples: `${PREFIX}lr list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
