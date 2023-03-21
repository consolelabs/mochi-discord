import { getPaginationRow } from "ui/discord/button"
import { render } from "./processor"
import { Message } from "discord.js"
import { listenForPaginateAction } from "handlers/discord/button"

const run = async (msg: Message) => {
  const userDiscordID = msg.author.id
  const { embed, totalPages } = await render(userDiscordID, 0)
  const total = totalPages ?? 1
  const msgOpts = {
    messageOptions: {
      embeds: [embed],
      components: getPaginationRow(0, total),
    },
  }
  const reply = await msg.reply(msgOpts.messageOptions as any)
  listenForPaginateAction(reply, msg, async (_msg, idx) => {
    const { embed } = await render(userDiscordID, idx)
    return {
      messageOptions: {
        embeds: [embed],
        components: getPaginationRow(idx, total),
      },
    }
  })
}
export default run
