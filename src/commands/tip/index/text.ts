import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"
import { tip } from "./processor"
import { equalIgnoreCase } from "utils/common"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  await tip(msg, args)
  return null
}
export default run
