import { CommandInteraction } from "discord.js"
import { balanceTypes, renderBalances } from "./processor"

const run = (i: CommandInteraction) => {
  const view = i.options.getBoolean("expand", false) ? "expand" : "compact"
  return renderBalances(i.user.id, i, balanceTypes.Offchain, view)
}
export default run
