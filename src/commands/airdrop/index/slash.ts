import { CommandInteraction } from "discord.js"
import { handleAirdrop } from "./processor"

async function run(interaction: CommandInteraction) {
  const amount = interaction.options.getString("amount", true)
  const token = interaction.options.getString("token", true)
  const duration = interaction.options.getString("duration")
  const entries = interaction.options.getString("entries")

  const args = [
    "airdrop",
    amount,
    token,
    ...(duration ? ["in", duration] : []),
    ...(entries ? ["for", entries] : []),
  ]
  return await handleAirdrop(interaction, args)
}

export default run
