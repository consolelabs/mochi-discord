import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { process } from "./processor"

const command: SlashCommand = {
  name: "data",
  category: "Config",
  onlyAdministrator: true,
  experimental: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("data")
      .setDescription("Query all space and proposal created by Mochi")
  },
  run: process,
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        usage: `${SLASH_PREFIX}proposal data`,
        examples: `${SLASH_PREFIX}proposal data`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
