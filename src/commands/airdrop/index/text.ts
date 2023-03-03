import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"
import * as processor from "./processor"

export const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  return await processor.handleAirdrop(msg, args)
}

export default run
