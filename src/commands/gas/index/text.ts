import { render, renderOne } from "./processor"
import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  if (args.length > 1) {
    return await renderOne(args[1])
  }
  return await render()
}
export default run
