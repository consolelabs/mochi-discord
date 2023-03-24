import { Message } from "discord.js"
import { tipTwitter } from "./processor"

const run = async (msg: Message, args: string[]) => {
  await tipTwitter(msg, args)
}
export default run
