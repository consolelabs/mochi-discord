import { Message } from "discord.js"
import * as processor from "./processor"
import { getCommandArguments } from "utils/commands"

export const run = async (msg: Message) => {
  const tokenSymbol = getCommandArguments(msg)[1]
  return await processor.deposit(msg, tokenSymbol)
}

export default run
