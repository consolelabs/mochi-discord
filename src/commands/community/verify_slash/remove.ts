import community from "adapters/community"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { APIError, GuildIdNotFoundError } from "errors"

export async function verifyRemove(interaction: CommandInteraction) {
  if (!interaction.guild) {
    throw new GuildIdNotFoundError({})
  }

  const infoRes = await community.getVerifyWalletChannel(interaction.guild.id)

  if (!infoRes.ok) {
    throw new APIError({
      curl: infoRes.curl,
      description: infoRes.log,
      user: interaction.user,
      guild: interaction.guild,
    })
  }

  if (!infoRes.data) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No config found",
            description: "No verify channel to remove",
          }),
        ],
      },
    }
  }

  const res = await community.deleteVerifyWalletChannel(interaction.guild.id)
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
          title: "Channel removed",
          description: `Instruction message removed\n**NOTE**: not having a channel for verification will limit the capabilities of Mochi, we suggest you set one by running \`$verify set #<channel_name>\``,
          originalMsgAuthor: interaction.user,
        }),
      ],
    },
  }
}

export const remove = new SlashCommandSubcommandBuilder()
  .setName("remove")
  .setDescription("Unset verify channel")
