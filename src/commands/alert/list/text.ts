import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { handleAlertList } from "./processor"
import { getPaginationRow } from "ui/discord/button"
import { listenForPaginateAction } from "handlers/discord/button"
import { Message } from "discord.js"

const command: Command = {
  id: "alert_list",
  command: "list",
  brief: "List of set up alert",
  category: "Defi",
  run: async function (msg) {
    const pages = await handleAlertList({ msg })
    if (pages.length === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              title: `Alert list`,
              description: `You haven't set any alert. To set up a new alert, you can use \`$alert add <token_symbol>\`.`,
            }),
          ],
        },
      }
    }

    const msgOpts = {
      messageOptions: {
        embeds: [pages[0]],
        components: getPaginationRow(0, pages.length),
      },
    }
    const reply = await msg.reply(msgOpts.messageOptions)
    listenForPaginateAction(reply, msg, async (_msg: Message, idx: number) => {
      return {
        messageOptions: {
          embeds: [pages[idx]],
          components: getPaginationRow(idx, pages.length),
        },
      }
    })
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}alert list`,
        examples: `${PREFIX}alert list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
}

export default command
