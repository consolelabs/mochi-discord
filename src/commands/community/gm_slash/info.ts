import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { handle } from "../gm/info"

export async function gmInfo(interaction: CommandInteraction) {
  if (!interaction.guild || !interaction.guildId) {
    throw new GuildIdNotFoundError({})
  }

  return await handle(interaction.guildId)
}

export const info = new SlashCommandSubcommandBuilder()
  .setName("info")
  .setDescription("Show gm channel")
