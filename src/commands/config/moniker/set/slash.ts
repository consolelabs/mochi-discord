import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { RequestUpsertMonikerConfigRequest } from "types/api"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { handleSetMoniker } from "./processor"

async function help() {
  return {
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}monikers set <moniker> <amount_token> <token>`,
        examples: `${SLASH_PREFIX}monikers set cup of coffee 0.01 bnb`,
      }),
    ],
  }
}

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
          .setDescription("enter moniker you want to configure")
          .setRequired(true),
      )
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("enter amount")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("enter token to convert moniker")
          .setRequired(true),
      )
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({ message: interaction })
    }
    const moniker = interaction.options.getString("moniker", true)
    const amount = interaction.options.getNumber("amount", true)
    const token = interaction.options.getString("token", true)

    const payload: RequestUpsertMonikerConfigRequest = {
      guild_id: interaction.guildId,
      moniker,
      amount,
      token,
    }
    return await handleSetMoniker(payload, interaction)
  },
  help,
  colorType: "Server",
}

export default command
