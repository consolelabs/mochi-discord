import { CommandInteraction } from "discord.js"
import { jumpToStep } from "./processor"

export default async function run(i: CommandInteraction) {
  const to = i.options.getString("to", true)
  const from = i.options.getString("from", false) ?? undefined
  const amount = i.options.getNumber("amount", false) ?? undefined
  const chainName = i.options.getString("chain_name", false) ?? undefined

  return await jumpToStep(i, {
    to: to.toUpperCase(),
    from: from?.toUpperCase(),
    amountIn: typeof amount === "number" ? amount.toString() : undefined,
    chainName,
    page: 0,
  })
}
