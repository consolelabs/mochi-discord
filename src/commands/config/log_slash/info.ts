import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { runLogInfo } from "../log/info"

export const info = new SlashCommandSubcommandBuilder()
  .setName("info")
  .setDescription("Show current logging channel info")

export async function logInfo(interaction: CommandInteraction) {
  return await runLogInfo({ guildId: interaction.guildId ?? undefined })
}
