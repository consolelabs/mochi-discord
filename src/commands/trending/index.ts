import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  TRENDING_GITBOOK,
  SLASH_PREFIX,
  DEFI_DEFAULT_FOOTER,
} from "utils/constants"
import { thumbnails } from "utils/common"
import trendingSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const slashCmd: SlashCommand = {
  name: "trending",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("trending")
      .setDescription("Trending search coin in last 24 hours")
    return data
  },
  run: trendingSlash,
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: thumbnails.TOKENS,
        usage: `${SLASH_PREFIX}trending`,
        description: "Show list trending search tokens in last 24 hours",
        footer: [DEFI_DEFAULT_FOOTER],
        examples: `${SLASH_PREFIX}trending`,
        document: TRENDING_GITBOOK,
      }),
    ],
  }),
  colorType: "Defi",
}

export default { slashCmd }
