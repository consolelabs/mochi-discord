import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handleTokenList } from "./processor"

const command: SlashCommand = {
  name: "list",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("View your Mochi supported tokens list")
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({ message: interaction })
    }
    return await handleTokenList()
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}tokens list`,
        examples: `${SLASH_PREFIX}tokens list`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
