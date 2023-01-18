import { getCommandArguments } from "utils/commands"
import { Message } from "discord.js"
import { claim } from "./processor"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  return await claim(msg, args)
}
export default run
