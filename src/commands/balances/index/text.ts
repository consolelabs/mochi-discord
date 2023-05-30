import { Message } from "discord.js"
import { BalanceType, renderBalances } from "./processor"

const run = async (msg: Message) =>
  renderBalances(msg.author.id, msg, BalanceType.Offchain, "")
export default run
