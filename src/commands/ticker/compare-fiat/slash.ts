import { CommandInteraction, SelectMenuInteraction } from "discord.js"
import { SlashCommandResponse } from "types/common"
import { composeFiatComparisonEmbed } from "./processor"

async function run(
  interaction: SelectMenuInteraction | CommandInteraction,
  baseQ: string,
  targetQ: string
): Promise<SlashCommandResponse> {
  return await composeFiatComparisonEmbed(interaction, baseQ, targetQ)
}

export default run
