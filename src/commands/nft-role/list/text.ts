import Config from "adapters/config"
import { APIError, GuildIdNotFoundError } from "errors"
import { list } from "../processor"
import { Command } from "types/common"
import { emojis, getEmojiURL, msgColors } from "utils/common"
import { NFT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"

const command: Command = {
  id: "nr_list",
  command: "list",
  brief: "Get server's nftroles configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const res = await Config.getGuildNFTRoleConfigs(msg.guildId)
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
            author: [title, getEmojiURL(emojis.NFTS)],
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
        usage: `${PREFIX}nr list`,
        examples: `${PREFIX}nr list`,
        document: `${NFT_ROLE_GITBOOK}&action=list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
