import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SALE_TRACKER_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handleSalesRemove } from "./processor"

const command: SlashCommand = {
  name: "remove",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a sales tracker from an NFT collection.")
      .addStringOption((option) =>
        option
          .setName("address")
          .setDescription(
            "NFT address. Example: 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73"
          )
          .setRequired(false)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }
    const address = interaction.options.getString("address")
    return await handleSalesRemove(
      interaction,
      interaction.guildId,
      address ?? "",
      interaction.user.id
    )
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `// Interactively\n${SLASH_PREFIX}sales remove\n\n// If you already know what to remove\n${SLASH_PREFIX}sales remove <contract-address>`,
        examples: `${SLASH_PREFIX}sales remove\n${SLASH_PREFIX}sales remove 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73`,
        document: `${SALE_TRACKER_GITBOOK}&action=remove`,
      }),
    ],
  }),
  colorType: "Marketplace",
}

export default command
