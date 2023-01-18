import { CommandInteraction } from "discord.js"
import { balanceTypes, renderBalances } from "./processor"

const run = (i: CommandInteraction) =>
  renderBalances(i.user.id, i, balanceTypes.Offchain)
export default run
