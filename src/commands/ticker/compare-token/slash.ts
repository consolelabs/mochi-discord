import { CommandInteraction, SelectMenuInteraction } from "discord.js"
import { SlashCommandResponse } from "types/common"
import { composeTokenComparisonEmbed } from "./processor"

async function run(
  interaction: SelectMenuInteraction | CommandInteraction,
  baseQ: string,
  targetQ: string
): Promise<SlashCommandResponse> {
  return await composeTokenComparisonEmbed(
    interaction.guildId ?? "",
    interaction.user.id,
    baseQ,
    targetQ
  )
}

export default run
