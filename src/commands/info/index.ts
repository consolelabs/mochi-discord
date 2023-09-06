import { SlashCommand } from "types/common"
import { thumbnails } from "utils/common"
import {
  BALANCE_GITBOOK,
  DEFI_DEFAULT_FOOTER,
  SLASH_PREFIX,
} from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import balanceSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const slashCmd: SlashCommand = {
  name: "info",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("info")
      .setDescription("Show all connected balances")
      .addBooleanOption((opt) =>
        opt
          .setName("expand")
          .setDescription("expand view, default view is compact")
          .setRequired(false),
      )
  },
  run: balanceSlash,
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          thumbnail: thumbnails.TOKENS,
          usage: `${SLASH_PREFIX}info`,
          description: "Show all connected balances",
          footer: [DEFI_DEFAULT_FOOTER],
          examples: `${SLASH_PREFIX}info`,
          document: BALANCE_GITBOOK,
        }),
      ],
    }),
  colorType: "Defi",
}

export default { slashCmd }
