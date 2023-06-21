import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { handleRoleList } from "./processor"

const command: SlashCommand = {
  name: "list",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("List all active reaction roles")
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        usage: `${SLASH_PREFIX}role reaction list`,
        examples: `${SLASH_PREFIX}role reaction list`,
      }),
    ],
  }),
  colorType: "Server",
  run: async (interaction: CommandInteraction) => {
    return {
      messageOptions: {
        ...(await handleRoleList(interaction)),
      },
    }
  },
}

export default command
