import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"
import { TokenEmojiKey } from "utils/common"
import * as processor from "./processor"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  const amountArg = args[1]
  const tokenArg = args[2].toUpperCase() as TokenEmojiKey
  await processor.withdraw(msg, amountArg, tokenArg)
}
export default run
