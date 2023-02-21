import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { handleAlertList } from "./processor"
import { getPaginationRow } from "ui/discord/button"
import { listenForPaginateInteraction } from "handlers/discord/button"

const command: SlashCommand = {
  name: "list",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("List of set up alert")
  },
  run: async (interaction: CommandInteraction) => {
    const pages = await handleAlertList({ interaction })
    if (pages.length === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              title: `Alert List`,
              description: `You haven't set any alert. To set up a new alert, you can use \`$alert add <token_symbol>\`.`,
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
    listenForPaginateInteraction(
      interaction,
      async (interaction: CommandInteraction, idx: number) => {
        return {
          messageOptions: {
            embeds: [pages[idx]],
            components: getPaginationRow(idx, pages.length),
          },
        }
      }
    )
    return msgOpts
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}alert list`,
        examples: `${SLASH_PREFIX}alert list`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
