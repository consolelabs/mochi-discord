import { render } from "./processor"
import { Message } from "discord.js"

const run = async (msg: Message) => {
  const userDiscordID = msg.author.id
  return await render(userDiscordID)
}
export default run
