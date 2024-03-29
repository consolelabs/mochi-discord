import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  GAINER_GITBOOK,
  SLASH_PREFIX,
  DEFI_DEFAULT_FOOTER,
} from "utils/constants"
import { thumbnails } from "utils/common"
import gainerSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"
import { TimeRange } from "./index/processor"

const slashCmd: SlashCommand = {
  name: "gainer",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("gainer")
      .setDescription(
        "Show top increasing tokens in last 1 hour, 24 hours, 7 days, 1 year",
      )
      .addStringOption((option) =>
        option
          .setName("time")
          .setDescription("time range you want")
          .setRequired(false)
          .addChoices(Object.keys(TimeRange).map((c) => [c, c])),
      )
  },
  run: gainerSlash,
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          thumbnail: thumbnails.TOKENS,
          usage: `${SLASH_PREFIX}gainer <time_range>`,
          description:
            "Show top increasing tokens in last 1 hour, 24 hours, 7 days, 1 year",
          footer: [DEFI_DEFAULT_FOOTER],
          examples: `${SLASH_PREFIX}gainer 1h\n${SLASH_PREFIX}gainer 24h\n${SLASH_PREFIX}gainer 7d`,
          document: GAINER_GITBOOK,
        }),
      ],
    }),
  colorType: "Defi",
}

export default { slashCmd }
