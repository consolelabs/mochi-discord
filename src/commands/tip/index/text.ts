import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"
import { tip } from "./processor"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  return await tip(msg, args)
}
export default run
