import { CommandInteraction } from "discord.js"
import { airdrop } from "./processor"

const run = async (interaction: CommandInteraction) => airdrop(interaction)

export default run
