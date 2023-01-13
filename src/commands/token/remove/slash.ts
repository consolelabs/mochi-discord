import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "discord/embed/ui"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handleTokenRemove } from "./processor"

const command: SlashCommand = {
  name: "remove",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a token from your server's list.")
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({ message: interaction })
    }

    return await handleTokenRemove(interaction.guildId, interaction.user.id)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}tokens remove`,
        examples: `${SLASH_PREFIX}tokens remove`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
