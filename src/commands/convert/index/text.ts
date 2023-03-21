import { render } from "./processor"
import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  return await render(msg, args)
}
export default run
