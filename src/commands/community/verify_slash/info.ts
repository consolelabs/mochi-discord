import community from "adapters/community"
import { composeEmbedMessage } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { APIError, GuildIdNotFoundError } from "errors"

export async function verifyInfo(interaction: CommandInteraction) {
  if (!interaction.guild) {
    throw new GuildIdNotFoundError({})
  }

  const res = await community.getVerifyWalletChannel(interaction.guild.id)
  if (!res.ok) {
    throw new APIError({
      curl: res.curl,
      description: res.log,
      user: interaction.user,
      guild: interaction.guild,
    })
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
          description: `Verify channel: <#${res.data.verify_channel_id}>${
            res.data.verify_role_id
              ? `. Verify role: <@&${res.data.verify_role_id}>`
              : ""
          }`,
          originalMsgAuthor: interaction.user,
        }),
      ],
    },
  }
}

export const info = new SlashCommandSubcommandBuilder()
  .setName("info")
  .setDescription("Show verify channel")
