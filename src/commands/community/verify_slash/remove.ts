import community from "adapters/community"
import { getErrorEmbed, getSuccessEmbed } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

export async function verifyRemove(interaction: CommandInteraction) {
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
