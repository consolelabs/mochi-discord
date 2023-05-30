import { collectButton, render } from "./processor"
import { CommandInteraction, Message } from "discord.js"

const run = async (i: CommandInteraction) => {
  const userDiscordID = i.user.id
  const msgOpts = await render(userDiscordID, 0)

  const reply = (await i.editReply({ ...msgOpts.messageOptions })) as Message

  collectButton(reply, i.user)

  return null
}
export default run
