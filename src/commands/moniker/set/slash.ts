import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { InternalError } from "errors"
import { RequestUpsertMonikerConfigRequest } from "types/api"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { handleSetMoniker } from "./processor"

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
    if (!interaction.guildId) {
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
      guild_id: interaction.guildId,
      moniker,
      amount,
      token,
    }
    return await handleSetMoniker(payload)
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
