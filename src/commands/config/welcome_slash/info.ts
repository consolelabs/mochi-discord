import config from "adapters/config"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { emojis, getEmojiURL } from "utils/common"

export function parseWelcomeMessage(msg: string) {
  return msg.replaceAll(`\\n`, "\n")
}

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
}
