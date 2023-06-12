import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { getAuthor } from "../../utils/common"
import { CommandInteraction } from "discord.js"
import { SlashCommandBuilder } from "@discordjs/builders"
import CacheManager from "../../cache/node-cache"
import run from "./index/slash"

CacheManager.init({
  ttl: 0,
  pool: "heatmap",
  checkperiod: 1,
})

const slashCmd: SlashCommand = {
  name: "heatmap",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("heatmap")
      .setDescription(
        "Show top cryptocurrencies with live prices and 24h change in price"
      )
  },
  run,
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}heatmap`,
        originalMsgAuthor: getAuthor(interaction),
      }),
    ],
  }),
  colorType: "Defi",
}

export default { slashCmd }
