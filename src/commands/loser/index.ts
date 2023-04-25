import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  LOSER_GITBOOK,
  SLASH_PREFIX,
  DEFI_DEFAULT_FOOTER,
} from "utils/constants"
import { thumbnails } from "utils/common"
import loserSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const choices = ["1h", "24h", "7d", "1y"]

const slashCmd: SlashCommand = {
  name: "loser",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("loser")
      .setDescription(
        "Show top decreasing tokens in last 1 hour, 24 hours, 7 days, 1 year"
      )
      .addStringOption((option) =>
        option
          .setName("time")
          .setDescription("time range you want")
          .setRequired(true)
          .addChoices(choices.map((c) => [c, c]))
      )
  },
  run: loserSlash,
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: thumbnails.TOKENS,
        usage: `${SLASH_PREFIX}loser <time_range>`,
        description:
          "Show top decreasing tokens in last 1 hour, 24 hours, 7 days, 1 year",
        footer: [DEFI_DEFAULT_FOOTER],
        examples: `${SLASH_PREFIX}loser 1h\n${SLASH_PREFIX}loser 24h\n${SLASH_PREFIX}loser 7d`,
        document: LOSER_GITBOOK,
      }),
    ],
  }),
  colorType: "Defi",
}

export default { slashCmd }
