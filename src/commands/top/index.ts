import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { run as topSlash } from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const slashCmd: SlashCommand = {
  name: "top",
  category: "Community",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("top")
      .setDescription("Show members with the highest server XP score")
  },
  run: topSlash,
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          usage: `${SLASH_PREFIX}top [page]`,
          examples: `${SLASH_PREFIX}top\n${SLASH_PREFIX}top 2`,
        }),
      ],
    }),
  colorType: "Server",
}

export default { slashCmd }
