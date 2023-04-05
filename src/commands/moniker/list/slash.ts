import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { emojis, getEmojiURL } from "utils/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { handleMonikerList } from "./processor"
import { getPaginationRow } from "ui/discord/button"
import { listenForPaginateInteraction } from "handlers/discord/button"
import { GuildIdNotFoundError } from "errors"

const command: SlashCommand = {
  name: "list",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("List all moniker configurations")
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guild) {
      throw new GuildIdNotFoundError({ message: interaction })
    }
    const pages = await handleMonikerList(
      interaction.guild.id,
      interaction.guild.name
    )
    if (pages.length === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              author: ["Moniker List", getEmojiURL(emojis.MONIKER)],
              description: `You haven't set any moniker. To set one, run ${SLASH_PREFIX}moniker set <moniker> <amount_token> <token> .`,
            }),
          ],
        },
      }
    }
    const msgOpts = {
      messageOptions: {
        embeds: [pages[0]],
        components: getPaginationRow(0, pages.length),
      },
    }
    listenForPaginateInteraction(interaction, async (_interaction, idx) => {
      return {
        messageOptions: {
          embeds: [pages[idx]],
          components: getPaginationRow(idx, pages.length),
        },
      }
    })
    return msgOpts
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}moniker list`,
        examples: `${SLASH_PREFIX}moniker list`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
