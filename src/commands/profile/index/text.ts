import { render } from "./processor"
import { Message } from "discord.js"

const run = async (msg: Message) => {
  const msgOpts = await render(msg, msg.member!)
  await msg.reply(msgOpts)
}
export default run
