import { composeEmbedMessage } from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { handle } from "../processor"

const command: SlashCommand = {
  name: "info",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Show current default role for newcomers")
  },
  run: handle,
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        usage: `${SLASH_PREFIX}role default info`,
        examples: `${SLASH_PREFIX}role default info`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
