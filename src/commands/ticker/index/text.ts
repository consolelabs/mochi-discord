import { Message } from "discord.js"
import { ticker } from "./processor"

async function run(msg: Message, base: string, chain?: string) {
  return await ticker(msg, base, chain)
}

export default run
