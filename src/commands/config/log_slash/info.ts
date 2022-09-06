import config from "adapters/config"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

export const info = new SlashCommandSubcommandBuilder()
  .setName("info")
  .setDescription("Show current logging channel info")

export async function logInfo(interaction: CommandInteraction) {
  if (!interaction.guildId || !interaction.guild) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "This command must be run in a Guild",
          }),
        ],
      },
    }
  }

  const guild = await config.getGuild(interaction.guildId)
  if (!guild) {
    throw new Error(`Guild ${interaction.guildId} not found`)
  }
  if (!guild.log_channel) {
    const embed = composeEmbedMessage(null, {
      author: [interaction.guild.name, interaction.guild.iconURL() ?? ""],
      description: `No logging channel configured for this guild.\nSet one with \`${PREFIX}log set <channel>.\``,
    })
    return { messageOptions: { embeds: [embed] } }
  }

  const embed = composeEmbedMessage(null, {
    author: [interaction.guild.name, interaction.guild.iconURL() ?? ""],
    description: `Current monitoring channel is <#${guild.log_channel}>.\nYou can update using \`${PREFIX}log set <channel>.\``,
  })
  return { messageOptions: { embeds: [embed] } }
}
