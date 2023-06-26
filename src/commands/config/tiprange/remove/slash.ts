import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { runTipRangeRemove } from "./processor"

const command: SlashCommand = {
  name: "remove",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Unset min and max tip range")
  },
  run: async (interaction: CommandInteraction) =>
    await runTipRangeRemove(interaction.guildId),
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          usage: `${SLASH_PREFIX}config tiprange remove`,
          examples: `${SLASH_PREFIX}config tiprange remove`,
        }),
      ],
    }),
  colorType: "Server",
}
export default command
