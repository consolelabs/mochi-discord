import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandArgumentError, GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handleTokenInfo } from "./processor"

const command: SlashCommand = {
  name: "info",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Information of a token.")
      .addStringOption((option) =>
        option
          .setName("symbol")
          .setDescription("token's symbol. Example: FTM")
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({ message: interaction })
    }

    const symbol = await interaction.options.getString("symbol")
    if (!symbol) {
      throw new CommandArgumentError({
        message: interaction,
        getHelpMessage: () => command.help(interaction),
      })
    }

    return await handleTokenInfo(interaction, symbol)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}tokens info <symbol>\n${SLASH_PREFIX}tokens info <id>`,
        examples: `${SLASH_PREFIX}tokens info eth\n${SLASH_PREFIX}tokens info ethereum`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
