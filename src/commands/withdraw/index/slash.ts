import { CommandInteraction } from "discord.js"
import * as processor from "./processor"

const run = async (interaction: CommandInteraction) => {
  const amount = interaction.options.getString("amount", true)
  const token = interaction.options.getString("token", true).toUpperCase()
  return await processor.withdraw(interaction, amount, token)
}
export default run
