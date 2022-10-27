import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { handle } from "../gm/streak"

export async function gmStreak(interaction: CommandInteraction) {
  if (!interaction.guild || !interaction.guildId) {
    throw new GuildIdNotFoundError({})
  }

  return await handle(interaction.user.id, interaction.guildId)
}

export const streak = new SlashCommandSubcommandBuilder()
  .setName("streak")
  .setDescription("Show your gm/gn streak")
