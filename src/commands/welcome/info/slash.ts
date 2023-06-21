import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { emojis, getEmojiURL } from "utils/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { parseWelcomeMessage } from "../processor"
import config from "adapters/config"

const command: SlashCommand = {
  name: "info",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Show current welcome channel info")
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

    const configs = await config.getCurrentWelcomeConfig(interaction.guild.id)
    if (!configs.ok) {
      throw new Error(`Failed to get welcome channel`)
    }

    const configData = configs.data
    if (!configData) {
      const embed = composeEmbedMessage(null, {
        author: ["Welcome Info", getEmojiURL(emojis.HELLO)],
        description: `No welcome channel configured for this guild.\nSet one with \`${SLASH_PREFIX}welcome set <channel>.\``,
        originalMsgAuthor: interaction.user,
      })
      return { messageOptions: { embeds: [embed] } }
    }

    const embed = composeEmbedMessage(null, {
      author: ["Welcome Info", getEmojiURL(emojis.HELLO)],
      description: `The current welcome message is:\n\n${parseWelcomeMessage(
        configData.welcome_message ?? ""
      )}"\n\nWelcome channel<#${configData.channel_id}>.`,
      originalMsgAuthor: interaction.user,
    })
    return { messageOptions: { embeds: [embed] } }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [composeEmbedMessage(interaction, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default command
