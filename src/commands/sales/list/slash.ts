import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { SALE_TRACKER_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handleSalesList } from "./processor"

const command: SlashCommand = {
  name: "list",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("Show list of trackers.")
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }
    return await handleSalesList(interaction, interaction.guildId)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        usage: `${SLASH_PREFIX}sales list`,
        examples: `${SLASH_PREFIX}sales list`,
        document: `${SALE_TRACKER_GITBOOK}&action=list`,
      }),
    ],
  }),
  colorType: "Marketplace",
}

export default command
