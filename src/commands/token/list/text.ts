import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { handleTokenList } from "./processor"
import { getPaginationRow } from "ui/discord/button"
import { listenForPaginateAction } from "handlers/discord/button"

const command: Command = {
  id: "list_server_token",
  command: "list",
  brief: "View your Mochi supported tokens list",
  category: "Community",
  run: async (msg) => {
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
    const { embed, totalPages } = await handleTokenList(0)
    const msgOpts = {
      messageOptions: {
        embeds: [embed],
        components: getPaginationRow(0, totalPages),
      },
    }
    const reply = await msg.reply(msgOpts.messageOptions)
    listenForPaginateAction(reply, msg, async (_msg, idx) => {
      const { embed } = await handleTokenList(idx)
      return {
        messageOptions: {
          embeds: [embed],
          components: getPaginationRow(idx, totalPages),
        },
      }
    })
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens list`,
        examples: `${PREFIX}tokens list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
}

export default command
