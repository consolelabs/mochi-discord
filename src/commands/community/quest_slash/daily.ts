import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { run } from "../quest/daily"

export const dailyMetadata = new SlashCommandSubcommandBuilder()
  .setName("daily")
  .setDescription("Your daily quests, resets at 00:00 UTC")

export async function daily(interaction: CommandInteraction) {
  if (!interaction.guild) {
    throw new GuildIdNotFoundError({})
  }

  return run(interaction.user.id, null)
}
