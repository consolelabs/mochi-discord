import { CommandInteraction } from "discord.js"
import { SlashCommandResponse } from "types/common"
import { ticker } from "./processor"

async function run(
  interaction: CommandInteraction,
  baseQ: string
): Promise<SlashCommandResponse> {
  return await ticker(interaction, baseQ)
}

export default run
