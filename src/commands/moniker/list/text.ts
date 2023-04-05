import { Message } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { emojis, getEmojiURL } from "utils/common"
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
    const pages = await handleMonikerList(msg.guildId, msg.guild?.name)

    if (pages.length === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              author: ["Moniker List", getEmojiURL(emojis.MONIKER)],
              description:
                "You haven't set any moniker. To set one, run $moniker set <moniker> <amount_token> <token> .",
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
          usage: `${PREFIX}moniker list`,
          examples: `${PREFIX}moniker list`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
