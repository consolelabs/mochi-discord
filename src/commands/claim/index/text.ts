import { getCommandArguments } from "utils/commands"
import { Message } from "discord.js"
import * as processor from "./processor"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  return await processor.claim(msg, args)
}
export default run
