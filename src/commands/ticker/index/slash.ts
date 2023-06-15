import { CommandInteraction } from "discord.js"
import { ticker } from "./processor"

async function run(
  interaction: CommandInteraction,
  baseQ: string,
  chain?: string
) {
  return await ticker(interaction, baseQ, chain)
}

export default run
