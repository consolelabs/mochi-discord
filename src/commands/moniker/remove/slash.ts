import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { APIError, InternalError } from "errors"
import { RequestDeleteMonikerConfigRequest } from "types/api"
import { SlashCommand } from "types/common"
import { getEmoji } from "utils/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a moniker configuration")
      .addStringOption((option) =>
        option
          .setName("moniker")
          .setDescription("moniker you want to remove")
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "This command must be run in a guild",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }
    const moniker = interaction.options.getString("moniker", true)
    if (!moniker) {
      throw new InternalError({
        message: interaction,
        description: "Invalid moinker",
      })
    }
    const payload: RequestDeleteMonikerConfigRequest = {
      guild_id: interaction.guild.id,
      moniker,
    }
    const { ok, log, curl } = await config.deleteMonikerConfig(payload)
    if (!ok) {
      throw new APIError({ description: log, curl })
    }
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: `${getEmoji("approve")} Successfully removed`,
            description: `**${moniker}** is removed. To set the new one, run $moniker set <moniker> <amount_token> <token>. ${getEmoji(
              "bucket_cash",
              true
            )}`,
          }),
        ],
      },
    }
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${PREFIX}monikers remove <moniker>`,
        examples: `${PREFIX}monikers remove cup of coffee`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
