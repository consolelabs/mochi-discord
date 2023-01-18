import { Command, SlashCommand } from "types/common"
import { getEmoji, thumbnails } from "utils/common"
import {
  BALANCE_GITBOOK,
  DEFI_DEFAULT_FOOTER,
  PREFIX,
  SLASH_PREFIX,
} from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import balance from "./index/text"
import balanceSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const textCmd: Command = {
  id: "balances",
  command: "balances",
  brief: "Wallet balances",
  category: "Defi",
  run: balance,
  featured: {
    title: `${getEmoji("cash")} Balance`,
    description: "Show your balances",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        usage: `${PREFIX}balance`,
        description: "Show your offchain balances",
        footer: [DEFI_DEFAULT_FOOTER],
        examples: `${PREFIX}balance\n${PREFIX}bals\n${PREFIX}bal`,
        document: BALANCE_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["balance", "bal", "bals"],
  allowDM: true,
  colorType: "Defi",
}

const slashCmd: SlashCommand = {
  name: "balances",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("balances")
      .setDescription("Show your balances")
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

export default { textCmd, slashCmd }
