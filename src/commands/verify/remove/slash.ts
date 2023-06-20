import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { runVerifyRemove } from "./processor"

const command: SlashCommand = {
  name: "remove",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Unset verify channel")
  },
  run: async (interaction: CommandInteraction) =>
    runVerifyRemove(interaction.guildId),
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        usage: `${SLASH_PREFIX}verify remove`,
        examples: `${SLASH_PREFIX}verify remove`,
      }),
    ],
  }),
  colorType: "Server",
}
export default command
