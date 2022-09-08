import config from "adapters/config"
import { getErrorEmbed, getSuccessEmbed } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

export const set = new SlashCommandSubcommandBuilder()
  .setName("set")
  .setDescription("Set logging channel to monitor guild members' activities")
  .addStringOption((option) =>
    option
      .setName("channel")
      .setDescription("the channel which you wanna log members' activities.")
      .setRequired(true)
  )

export async function setLog(interaction: CommandInteraction) {
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

  const channelArg = interaction.options.getString("channel")
  if (
    !channelArg ||
    !channelArg.startsWith("<#") ||
    !channelArg.endsWith(">")
  ) {
    return {
      messageOptions: {
        embeds: [getErrorEmbed({ description: "Invalid channel" })],
      },
    }
  }

  const logChannel = channelArg.substring(2, channelArg.length - 1)
  const chan = await interaction.guild.channels
    .fetch(logChannel)
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

  await config.updateGuild({ guildId: interaction.guild.id, logChannel })

  const embed = getSuccessEmbed({
    title: interaction.guild.name,
    description: `Successfully set <#${logChannel}> as log channel`,
    originalMsgAuthor: interaction.user,
  })
  return { messageOptions: { embeds: [embed] } }
}
