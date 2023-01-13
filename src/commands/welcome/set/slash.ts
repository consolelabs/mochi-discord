import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import {
  composeEmbedMessage2,
  getErrorEmbed,
  getSuccessEmbed,
} from "discord/embed/ui"
import { parseWelcomeMessage } from "../processor"
import { parseDiscordToken } from "utils/commands"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Set welcome channel to greet mew members")
      .addStringOption((option) =>
        option
          .setName("channel")
          .setDescription(
            "the channel which you want to welcome new members. #general"
          )
          .setRequired(true)
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

    const { isChannel, value: channelId } = parseDiscordToken(
      interaction.options.getString("channel") ?? ""
    )
    if (!isChannel) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "Invalid channel. Please choose another one!",
            }),
          ],
        },
      }
    }

    const chan = await interaction.guild.channels
      .fetch(channelId)
      .catch(() => undefined)
    if (!chan)
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "Channel not found",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    if (!chan.isText())
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "Channel has to be text",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    const newConfig = await config.updateWelcomeConfig(
      interaction.guild.id,
      channelId
    )
    if (!newConfig.ok) {
      throw new Error(`Failed to update welcome message`)
    }
    const newConfigData = newConfig.data
    if (!newConfigData) {
      throw new Error(`Failed to update welcome message`)
    }

    const embed = getSuccessEmbed({
      title: interaction.guild.name,
      description: `Successfully set <#${channelId}> as welcome channel.\nWelcome message:\n\n${parseWelcomeMessage(
        newConfigData.welcome_message ?? ""
      )}`,
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
