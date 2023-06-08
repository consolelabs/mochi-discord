import { SlashCommand } from "types/common"
import {
  DEFI_DEFAULT_FOOTER,
  DEPOSIT_GITBOOK,
  SLASH_PREFIX,
} from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { thumbnails } from "utils/common"
import { SlashCommandBuilder } from "@discordjs/builders"
import withdrawSlash from "./index/slash"

const slashCmd: SlashCommand = {
  name: "withdraw",
  category: "Defi",
  ephemeral: true,
  prepare: (alias = "withdraw") => {
    return new SlashCommandBuilder()
      .setName(alias)
      .setDescription("Withdraw tokens to your wallet outside of Discord.")
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("symbol of token. Example: ftm")
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("amount")
          .setDescription(
            "specific amount you want to withdraw or all. Example: 1, all"
          )
          .setRequired(false)
      )
  },
  run: withdrawSlash,
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          thumbnail: thumbnails.TOKENS,
          usage: `${SLASH_PREFIX}withdraw`,
          description:
            "Withdraw tokens to your wallet outside of Discord. A network fee will be added on top of your withdrawal (or deducted if remaining balance is insufficient).\nYou will be asked to confirm it.",
          footer: [DEFI_DEFAULT_FOOTER],
          examples: `${SLASH_PREFIX}withdraw\n${SLASH_PREFIX}wd`,
          document: DEPOSIT_GITBOOK,
        }),
      ],
    }),
  colorType: "Defi",
}

export default { slashCmd }
