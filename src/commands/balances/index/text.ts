import { Message } from "discord.js"
import { balanceTypes, renderBalances } from "./processor"

const run = async (msg: Message) =>
  renderBalances(msg.author.id, msg, balanceTypes.Offchain)
export default run
