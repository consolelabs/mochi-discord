import { CommandInteraction } from "discord.js"
import { BalanceType, renderBalances } from "./processor"

const run = (i: CommandInteraction) => {
  const view = i.options.getBoolean("expand", false) ? "expand" : "compact"
  return renderBalances("393034938028392449", i, BalanceType.Offchain, "", view)
}
export default run
