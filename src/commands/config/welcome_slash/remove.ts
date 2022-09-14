import config from "adapters/config"
import { getErrorEmbed, getSuccessEmbed } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

export const remove = new SlashCommandSubcommandBuilder()
  .setName("remove")
  .setDescription("Remove welcome channel config")

export async function removeWelcome(interaction: CommandInteraction) {
  if (!interaction.guild) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "This command must be run in a Guild",
            originalMsgAuthor: interaction.user,
          }),
        ],
      },
    }
  }

  await config.removeWelcomeConfig(interaction.guild.id)

  const embed = getSuccessEmbed({
    title: interaction.guild.name,
    description: `Successfully removed welcome channel`,
    originalMsgAuthor: interaction.user,
  })
  return { messageOptions: { embeds: [embed] } }
}
