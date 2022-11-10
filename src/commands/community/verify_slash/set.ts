import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { runVerifySet } from "../verify/set"

export async function verifySet(interaction: CommandInteraction) {
  return runVerifySet({ interaction, guildId: interaction.guildId })
}

export const set = new SlashCommandSubcommandBuilder()
  .setName("set")
  .setDescription("Create verify wallet channel")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription(
        "the channel which you wanna create verify wallet. Example: #general"
      )
      .setRequired(true)
  )
  .addRoleOption((option) =>
    option
      .setName("role")
      .setDescription(
        "the role to assign to user when they are verified. Example: @verified"
      )
      .setRequired(false)
  )
