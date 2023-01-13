import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import {
  composeEmbedMessage2,
  getErrorEmbed,
  getSuccessEmbed,
} from "discord/embed/ui"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove welcome channel config")
  },
  run: async (interaction: CommandInteraction) => {
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
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [composeEmbedMessage2(interaction, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default command
