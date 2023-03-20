import { render, renderOne } from "./processor"
import { CommandInteraction } from "discord.js"

const run = async (i: CommandInteraction) => {
  const chain = i.options.getString("chain")
  if (chain) {
    return await renderOne(chain)
  }
  return await render()
}
export default run
