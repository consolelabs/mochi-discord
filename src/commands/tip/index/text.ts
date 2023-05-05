import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"
import { tip } from "./processor"

const run = async (msg: Message) => {
  throw new Error("tip boom")
  const args = getCommandArguments(msg)
  await tip(msg, args)
  return null
}
export default run
