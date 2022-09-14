import config from "adapters/config"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

export const info = new SlashCommandSubcommandBuilder()
  .setName("info")
  .setDescription("Show current welcome channel info")

export async function welcomeInfo(interaction: CommandInteraction) {
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

  const configs = await config.getCurrentWelcomeConfig(interaction.guild.id)
  if (!configs.ok) {
    throw new Error(`Failed to get welcome channel`)
  }

  const configData = configs.data
  if (!configData) {
    throw new Error(`Failed to get welcome channel response`)
  }

  if (!configData.welcome_message) {
    const embed = composeEmbedMessage(null, {
      author: [interaction.guild.name, interaction.guild.iconURL() ?? ""],
      description: `No welcome channel configured for this guild.\nSet one with \`${SLASH_PREFIX}welcome set <channel>.\``,
      originalMsgAuthor: interaction.user,
    })
    return { messageOptions: { embeds: [embed] } }
  }

  const embed = composeEmbedMessage(null, {
    author: [interaction.guild.name, interaction.guild.iconURL() ?? ""],
    description: `Current welcome channel is <#${configData.channel_id}>.\nYou can update using \`${SLASH_PREFIX}welcome set <channel>.\` \n\n The current welcome message is "${configData.welcome_message}"\nYou can update using \`${SLASH_PREFIX}welcome message <channel>.\``,
    originalMsgAuthor: interaction.user,
  })
  return { messageOptions: { embeds: [embed] } }
}
