import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handleTokenList } from "./processor"
import { listenForPaginateInteraction } from "handlers/discord/button"
import { getPaginationRow } from "ui/discord/button"

const command: SlashCommand = {
  name: "list",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("View your Mochi supported tokens list")
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({ message: interaction })
    }
    const { embed, totalPages } = await handleTokenList(0)
    const msgOpts = {
      messageOptions: {
        embeds: [embed],
        components: getPaginationRow(0, totalPages),
      },
    }
    listenForPaginateInteraction(interaction, async (_interaction, idx) => {
      const { embed } = await handleTokenList(idx)
      return {
        messageOptions: {
          embeds: [embed],
          components: getPaginationRow(idx, totalPages),
        },
      }
    })
    return msgOpts
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        usage: `${SLASH_PREFIX}tokens list`,
        examples: `${SLASH_PREFIX}tokens list`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
