import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"
import { composeTopEmbed } from "./processor"
import { listenForPaginateAction } from "handlers/discord/button"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  let page = args.length > 1 ? +args[1] : 0
  page = Math.max(isNaN(page) ? 0 : page - 1, 0)

  const msgOpts = await composeTopEmbed(msg, page)
  const reply = await msg.reply(msgOpts.messageOptions)
  listenForPaginateAction(reply, msg, composeTopEmbed, true)
}
export default run
