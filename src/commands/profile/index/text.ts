import { getCommandArguments } from "utils/commands"
import { handleProfile } from "./processor"
import { Message } from "discord.js"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  return await handleProfile(msg, args)
}
export default run
