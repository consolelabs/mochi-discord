import { composeEmbedMessage2 } from "utils/discordEmbed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { handle } from "../defaultRole/info"

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
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}defaultrole info`,
        examples: `${SLASH_PREFIX}defaultrole info`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
