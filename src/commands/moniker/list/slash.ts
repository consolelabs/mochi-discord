import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { getEmoji } from "utils/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { handleMonikerList } from "./processor"
import { getPaginationRow } from "ui/discord/button"
import { listenForPaginateInteraction } from "handlers/discord/button"

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
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "This command must be run in a guild",
              description:
                "User invoked a command that was likely in a DM because guild id can not be found",
            }),
          ],
        },
      }
    }
    const pages = await handleMonikerList(interaction.guild.id)
    if (pages.length === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              title: `${getEmoji("bucket_cash", true)} Moniker List`,
              description:
                "You haven't set any moniker. To set one, run $moniker set <moniker> <amount_token> <token> .",
              color: "#5CD97D",
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
        usage: `${SLASH_PREFIX}monikers list`,
        examples: `${SLASH_PREFIX}monikers list`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
