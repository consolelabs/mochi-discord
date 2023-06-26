import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { runCurrencyRemove } from "./processor"

const command: SlashCommand = {
  name: "remove",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Unset default currency")
  },
  run: async (interaction: CommandInteraction) =>
    await runCurrencyRemove(interaction.guildId),
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          usage: `${SLASH_PREFIX}config currency remove`,
          examples: `${SLASH_PREFIX}config currency remove`,
        }),
      ],
    }),
  colorType: "Server",
}
export default command
