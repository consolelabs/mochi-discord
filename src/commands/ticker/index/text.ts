import { Message } from "discord.js"
import { ticker } from "./processor"

async function run(msg: Message, base: string) {
  return await ticker(msg, base)
}

export default run
