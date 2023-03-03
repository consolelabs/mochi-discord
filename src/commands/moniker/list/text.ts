import { Message } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { handleMonikerList } from "./processor"

import { getPaginationRow } from "ui/discord/button"
import { listenForPaginateAction } from "handlers/discord/button"

const command: Command = {
  id: "moniker_list",
  command: "list",
  brief: "List all moniker configuations",
  category: "Config",
  run: async (msg: Message) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const pages = await handleMonikerList(msg.guildId)
    if (pages.length === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              title: `${getEmoji("bucket_cash", true)} Moniker List`,
              description:
                "You haven't set any moniker. To set one, run $moniker set <moniker> <amount_token> <token> .",
              color: "#5CD97D",
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
    listenForPaginateAction(reply, msg, async (_msg, idx) => {
      return {
        messageOptions: {
          embeds: [pages[idx]],
          components: getPaginationRow(idx, pages.length),
        },
      }
    })
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}monikers list`,
          examples: `${PREFIX}monikers list`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
