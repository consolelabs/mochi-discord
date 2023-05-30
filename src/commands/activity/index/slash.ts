import { render } from "./processor"
import { CommandInteraction } from "discord.js"
import { listenForPaginateAction } from "handlers/discord/button"
import { reply } from "utils/discord"

const run = async (i: CommandInteraction) => {
  const userDiscordID = i.user.id
  const msgOpts = await render(userDiscordID, 0)
  const replyMsg = await reply(i, msgOpts)
  if (replyMsg) {
    listenForPaginateAction(
      replyMsg,
      replyMsg,
      async (_interaction, idx) => {
        return await render(userDiscordID, idx)
      },
      false,
      false,
      (bi) => bi.user.id === i.user.id
    )
  }
}
export default run
