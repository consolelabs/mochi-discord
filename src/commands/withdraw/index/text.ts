import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"
import { TokenEmojiKey } from "utils/common"
import * as processor from "./processor"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  await processor.withdraw(msg, args[1], args[2] as TokenEmojiKey)
}
export default run
