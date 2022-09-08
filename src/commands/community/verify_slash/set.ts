import community from "adapters/community"
import { getErrorEmbed, getSuccessEmbed } from "utils/discordEmbed"
import { parseDiscordToken } from "utils/commands"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

export async function verifySet(interaction: CommandInteraction) {
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

  const existChannel = await community.getVerifyWalletChannel(
    interaction.guild.id
  )
  if (existChannel.ok && existChannel.data?.verify_channel_id) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: `Your server already setup a channel for that -> <#${existChannel.data.verify_channel_id}>`,
            originalMsgAuthor: interaction.user,
          }),
        ],
      },
    }
  }
  const { isChannel, id: channelId } = parseDiscordToken(
    interaction.options.getString("channel", true)
  )
  if (!isChannel) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "Invalid channel",
            originalMsgAuthor: interaction.user,
          }),
        ],
      },
    }
  }

  const createVerifyWalletRequest = {
    verify_channel_id: channelId,
    guild_id: interaction.guild.id,
  }

  const res = await community.createVerifyWalletChannel(
    createVerifyWalletRequest
  )
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

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Channel set",
          description: `Mochi sent verify instructions to <#${channelId}> channel`,
          originalMsgAuthor: interaction.user,
        }),
      ],
    },
  }
}

export const set = new SlashCommandSubcommandBuilder()
  .setName("set")
  .setDescription("Create verify wallet channel")
  .addStringOption((option) =>
    option
      .setName("channel")
      .setDescription("the channel which you wanna create verify wallet.")
      .setRequired(true)
  )
