import { getPaginationRow } from "ui/discord/button"
import { render } from "./processor"
import { CommandInteraction } from "discord.js"
import { listenForPaginateAction } from "handlers/discord/button"
import { reply } from "utils/discord"

const run = async (i: CommandInteraction) => {
  const userDiscordID = i.user.id
  const { embed, totalPages } = await render(userDiscordID, 0)
  const total = totalPages ?? 1
  const msgOpts = {
    messageOptions: {
      embeds: [embed],
      components: getPaginationRow(0, total),
    },
  }
  const replyMsg = await reply(i, msgOpts)
  if (replyMsg) {
    listenForPaginateAction(
      replyMsg,
      replyMsg,
      async (_interaction, idx) => {
        const { embed } = await render(userDiscordID, idx)
        return {
          messageOptions: {
            embeds: [embed],
            components: getPaginationRow(idx, total),
          },
        }
      },
      false,
      false,
      (bi) => bi.user.id === i.user.id
    )
  }
}
export default run
