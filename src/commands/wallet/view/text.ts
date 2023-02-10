import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { viewWalletsList, viewWalletDetails } from "./processor"

const command: Command = {
  id: "wallet_view",
  command: "view",
  brief: "Show all your interested wallets assets and activities.",
  category: "Defi",
  run: async (msg) => {
    const args = getCommandArguments(msg)
    const { author } = msg
    switch (args.length) {
      case 2:
        return await viewWalletsList(msg, author)
      default:
        return await viewWalletDetails(msg, author, args[2])
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}wallet view [address]/[alias]`,
        examples: `${PREFIX}wallet view\n${PREFIX}wallet view 0xfBe6403a719d0572Ea4BA0E1c01178835b1D3bE4\n${PREFIX}wallet view mywallet`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 2,
}

export default command
