import { Command, SlashCommand } from "types/common"
import {
  DEFI_DEFAULT_FOOTER,
  DEPOSIT_GITBOOK,
  PREFIX,
  SLASH_PREFIX,
} from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, thumbnails } from "utils/common"
import { SlashCommandBuilder } from "@discordjs/builders"
import withdraw from "./index/text"
import withdrawSlash from "./index/slash"

const textCmd: Command = {
  id: "withdraw",
  command: "withdraw",
  brief: `Token withdrawal`,
  category: "Defi",
  run: withdraw,
  featured: {
    title: `${getEmoji("right_arrow")} Withdraw`,
    description: "Withdraw tokens to your wallet outside of Discord",
  },
  getHelpMessage: async (msg) => {
    const embedMsg = composeEmbedMessage(msg, {
      description:
        "Withdraw tokens to your wallet outside of Discord. A network fee will be added on top of your withdrawal (or deducted if remaining balance is insufficient).\nYou will be asked to confirm it.",
      usage: `${PREFIX}withdraw <amount> <token>`,
      examples: `${PREFIX}withdraw 5 ftm`,
      document: DEPOSIT_GITBOOK,
      footer: [DEFI_DEFAULT_FOOTER],
    })
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
  aliases: ["wd"],
  colorType: "Defi",
  allowDM: true,
  minArguments: 3,
}

const slashCmd: SlashCommand = {
  name: "withdraw",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("withdraw")
      .setDescription("Withdraw tokens to your wallet outside of Discord.")
      .addStringOption((option) =>
        option
          .setName("amount")
          .setDescription(
            "specific amount you want to withdraw or all. Example: 1, all"
          )
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("symbol of token. Example: ftm")
          .setRequired(true)
      )
  },
  run: withdrawSlash,
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: thumbnails.TOKENS,
        usage: `${SLASH_PREFIX}withdraw <amount> <token>`,
        description:
          "Withdraw tokens to your wallet outside of Discord. A network fee will be added on top of your withdrawal (or deducted if remaining balance is insufficient).\nYou will be asked to confirm it.",
        footer: [DEFI_DEFAULT_FOOTER],
        examples: `${SLASH_PREFIX}wd 5 ftm\n${SLASH_PREFIX}withdraw 5 ftm`,
        document: DEPOSIT_GITBOOK,
      }),
    ],
  }),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
