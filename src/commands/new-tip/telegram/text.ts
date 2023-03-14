import { Message } from "discord.js"
import { tipTelegram } from "./processor"

const run = async (msg: Message, args: string[]) => {
  await tipTelegram(msg, args)
}
export default run
