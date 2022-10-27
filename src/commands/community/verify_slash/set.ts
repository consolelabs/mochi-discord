import community from "adapters/community"
import { getErrorEmbed, getSuccessEmbed } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"

export async function verifySet(interaction: CommandInteraction) {
  if (!interaction.guild) {
    throw new GuildIdNotFoundError({})
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
  const channel = interaction.options.getChannel("channel", true)
  const channelId = channel.id
  if (channel.type !== "GUILD_TEXT") {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "Invalid channel. Please choose another one!",
            originalMsgAuthor: interaction.user,
          }),
        ],
      },
    }
  }

  const role = interaction.options.getRole("role", false)
  const roleId = role?.id

  const createVerifyWalletRequest = {
    verify_channel_id: channelId,
    guild_id: interaction.guild.id,
    ...(roleId ? { verify_role_id: roleId } : {}),
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
          description: `Mochi sent verify instructions to <#${channelId}> channel${
            roleId
              ? `. In addition, user will be assigned role <@&${roleId}> upon successful verification`
              : ""
          }`,
          originalMsgAuthor: interaction.user,
        }),
      ],
    },
  }
}

export const set = new SlashCommandSubcommandBuilder()
  .setName("set")
  .setDescription("Create verify wallet channel")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription(
        "the channel which you wanna create verify wallet. Example: #general"
      )
      .setRequired(true)
  )
  .addRoleOption((option) =>
    option
      .setName("role")
      .setDescription(
        "the role to assign to user when they are verified. Example: @verified"
      )
      .setRequired(false)
  )
