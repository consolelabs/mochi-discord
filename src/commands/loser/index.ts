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

const choices = ["1h", "24h", "7d"]

const slashCmd: SlashCommand = {
  name: "loser",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("loser")
      .setDescription(
        "Show top increasing tokens in last 1 hour, 24 hours, 7 days"
      )
      .addStringOption((option) =>
        option
          .setName("time")
          .setDescription("time range you want")
          .setRequired(true)
          .addChoices(choices.map((c) => [c, c]))
      )
    return data
  },
  run: loserSlash,
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: thumbnails.TOKENS,
        usage: `${SLASH_PREFIX}loser <time_range>`,
        description:
          "Show top increasing tokens in last 1 hour, 24 hours, 7 days",
        footer: [DEFI_DEFAULT_FOOTER],
        examples: `${SLASH_PREFIX}loser 1h\n${SLASH_PREFIX}loser 24h\n${SLASH_PREFIX}loser 7d`,
        document: LOSER_GITBOOK,
      }),
    ],
  }),
  colorType: "Defi",
}

export default { slashCmd }
