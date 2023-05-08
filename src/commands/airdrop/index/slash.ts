import { CommandInteraction } from "discord.js"
import { airdrop } from "./processor"

const run = async (interaction: CommandInteraction) =>
  await airdrop(interaction)

export default run
