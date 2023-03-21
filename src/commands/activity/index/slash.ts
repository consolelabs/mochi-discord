import { getPaginationRow } from "ui/discord/button"
import { render } from "./processor"
import { CommandInteraction } from "discord.js"
import { listenForPaginateInteraction } from "handlers/discord/button"

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
  listenForPaginateInteraction(i, async (_interaction, idx) => {
    const { embed } = await render(userDiscordID, idx)
    return {
      messageOptions: {
        embeds: [embed],
        components: getPaginationRow(idx, total),
      },
    }
  })
  return msgOpts
}
export default run
