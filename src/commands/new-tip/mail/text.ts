import { Message } from "discord.js"
import { tipMail } from "./processor"

const run = async (msg: Message, args: string[]) => {
  await tipMail(msg, args)
}
export default run
