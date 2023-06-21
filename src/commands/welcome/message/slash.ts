import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { emojis } from "utils/common"
import { SLASH_PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import { parseWelcomeMessage } from "../processor"

const command: SlashCommand = {
  name: "message",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("message")
      .setDescription("Set the welcome message")
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription(
            `Use $name to mention username and \\n to add a paragraph`
          )
          .setRequired(false)
      )
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

    const currentWelcomeConfig = await config.getCurrentWelcomeConfig(
      interaction.guild.id
    )
    if (!currentWelcomeConfig.ok) {
      throw new Error(`Failed to get current welcome message`)
    }
    if (currentWelcomeConfig.data == null) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: `Please set a welcome channel first using \`${SLASH_PREFIX}welcome set\` `,
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }

    let messageArg = interaction.options.getString("message")
    if (!messageArg) {
      messageArg = ""
    }
    const newConfig = await config.updateWelcomeConfig(
      interaction.guild.id,
      currentWelcomeConfig.data.channel_id ?? "",
      messageArg
    )
    if (!newConfig.ok) {
      throw new Error(`Failed to update welcome message`)
    }

    const newConfigData = newConfig.data
    if (!newConfigData) {
      throw new Error(`Failed to update welcome message`)
    }

    const embed = getSuccessEmbed({
      title: "Welcome message",
      emojiId: emojis.HELLO,
      description: `Successfully set new welcome message:\n\n${parseWelcomeMessage(
        newConfigData.welcome_message ?? ""
      )}\n\nWelcome channel: <#${newConfig.data.channel_id}>`,
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
