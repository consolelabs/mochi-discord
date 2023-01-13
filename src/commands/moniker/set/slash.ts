import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { APIError, InternalError } from "errors"
import { RequestUpsertMonikerConfigRequest } from "types/api"
import { SlashCommand } from "types/common"
import { getEmoji } from "utils/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Set a new moniker configuration")
      .addStringOption((option) =>
        option
          .setName("moniker")
          .setDescription("moniker you want to configure")
          .setRequired(true)
      )
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("moniker equal to amount of token")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("token to convert moinker")
          .setRequired(true)
      )
  },
  run: async (interaction: CommandInteraction) => {
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
    const amount = interaction.options.getNumber("amount", true)
    if (!amount) {
      throw new InternalError({
        message: interaction,
        description: "Invalid amount",
      })
    }
    const token = interaction.options.getString("token", true)
    if (!token) {
      throw new InternalError({
        message: interaction,
        description: "Invalid token",
      })
    }
    const payload: RequestUpsertMonikerConfigRequest = {
      guild_id: interaction.guild.id,
      moniker,
      amount,
      token,
    }
    const { ok, log, curl } = await config.setMonikerConfig(payload)
    if (!ok) {
      throw new APIError({ description: log, curl })
    }
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: `${getEmoji("approve")} Moniker successfully set`,
            description: `1 **${moniker}** is set as ${amount} **${token}**. To tip your friend moniker, use $tip <@users> <amount> <moniker>. ${getEmoji(
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
        usage: `${PREFIX}monikers set <moniker> <amount_token> <token>`,
        examples: `${PREFIX}monikers set cup of coffee 0.01 bnb`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
