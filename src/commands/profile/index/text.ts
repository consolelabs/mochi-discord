import { getCommandArguments } from "utils/commands"
import { render } from "./processor"
import { Message } from "discord.js"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  return await render(msg, args[1])
}
export default run
