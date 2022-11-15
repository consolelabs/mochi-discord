import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { runVerify } from "../verify/info"

export async function verifyInfo(interaction: CommandInteraction) {
  return await runVerify(null, interaction.guildId)
}

export const info = new SlashCommandSubcommandBuilder()
  .setName("info")
  .setDescription("Show verify channel")
