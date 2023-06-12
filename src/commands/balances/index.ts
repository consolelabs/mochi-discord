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
  name: "balances",
  category: "Defi",
  prepare: (aliasName = "balances") => {
    return new SlashCommandBuilder()
      .setName(aliasName)
      .setDescription("Show your balances")
      .addBooleanOption((opt) =>
        opt
          .setName("expand")
          .setDescription("expand view, default view is compact")
          .setRequired(false)
      )
  },
  run: balanceSlash,
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: thumbnails.TOKENS,
        usage: `${SLASH_PREFIX}balance`,
        description: "Show your offchain balances",
        footer: [DEFI_DEFAULT_FOOTER],
        examples: `${SLASH_PREFIX}balance\n${SLASH_PREFIX}bals\n${SLASH_PREFIX}bal`,
        document: BALANCE_GITBOOK,
      }),
    ],
  }),
  colorType: "Defi",
}

export default { slashCmd }
