import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import {
  composeEmbedMessage,
  composeEmbedMessage2,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import community from "adapters/community"
import { APIError, GuildIdNotFoundError } from "errors"
import { SLASH_PREFIX, VERIFY_WALLET_GITBOOK } from "utils/constants"

const command: SlashCommand = {
  name: "info",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Show verify channel")
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
        usage: `${SLASH_PREFIX}verify info`,
        examples: `${SLASH_PREFIX}verify info`,
        document: `${VERIFY_WALLET_GITBOOK}&action=info`,
        footer: [
          `Type ${SLASH_PREFIX}help verify <action> for a specific action!`,
        ],
      }),
    ],
  }),
  colorType: "Server",
}
export default command
