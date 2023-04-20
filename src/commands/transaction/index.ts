import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  GAINER_GITBOOK,
  SLASH_PREFIX,
  DEFI_DEFAULT_FOOTER,
} from "utils/constants"
import { thumbnails } from "utils/common"
import transactionSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const slashCmd: SlashCommand = {
  name: "transaction",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("transaction")
      .setDescription("Show history of transaction")
    return data
  },
  run: transactionSlash,
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: thumbnails.TOKENS,
        usage: `${SLASH_PREFIX}transaction`,
        description: "Show history of transaction",
        footer: [DEFI_DEFAULT_FOOTER],
        examples: `${SLASH_PREFIX}transaction`,
        document: GAINER_GITBOOK,
      }),
    ],
  }),
  colorType: "Defi",
}

export default { slashCmd }
