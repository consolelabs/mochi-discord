import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandArgumentError, GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import * as processor from "./processor"

const command: SlashCommand = {
  name: "default",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("default")
      .setDescription("Set default token for your server.")
      .addStringOption((option) =>
        option
          .setName("symbol")
          .setDescription("token's symbol. Example: FTM")
          .setRequired(true),
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
    const embeds = await processor.handleTokenDefault(interaction, symbol)
    return {
      messageOptions: {
        ...embeds,
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}tokens default <symbol>`,
        examples: `${SLASH_PREFIX}tokens default cake`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
