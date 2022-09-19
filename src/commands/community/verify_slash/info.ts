import community from "adapters/community"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

export async function verifyInfo(interaction: CommandInteraction) {
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

  const res = await community.getVerifyWalletChannel(interaction.guild.id)
  if (!res.ok) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: res.error,
            originalMsgAuthor: interaction.user,
          }),
        ],
      },
    }
  }
  if (!res.data) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: interaction.guild.name,
            description: `No config found`,
            originalMsgAuthor: interaction.user,
          }),
        ],
      },
    }
  }
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: interaction.guild.name,
          description: `Verified channel: <#${res.data.verify_channel_id}>`,
          originalMsgAuthor: interaction.user,
        }),
      ],
    },
  }
}

export const info = new SlashCommandSubcommandBuilder()
  .setName("info")
  .setDescription("Show verify channel")
