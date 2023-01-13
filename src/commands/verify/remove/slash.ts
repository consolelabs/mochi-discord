import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  composeEmbedMessage2,
  getErrorEmbed,
  getSuccessEmbed,
} from "discord/embed/ui"
import community from "adapters/community"
import { APIError, GuildIdNotFoundError } from "errors"

const command: SlashCommand = {
  name: "remove",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Unset verify channel")
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guild) {
      throw new GuildIdNotFoundError({})
    }

    const infoRes = await community.getVerifyWalletChannel(interaction.guild.id)

    if (!infoRes.ok) {
      throw new APIError({
        message: interaction,
        curl: infoRes.curl,
        description: infoRes.log,
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
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}verify remove`,
        examples: `${SLASH_PREFIX}verify remove`,
      }),
    ],
  }),
  colorType: "Server",
}
export default command
