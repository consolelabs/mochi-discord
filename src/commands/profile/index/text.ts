import { render } from "./processor"
import { Message } from "discord.js"

const run = async (msg: Message) => {
  return await render(msg)
}
export default run
