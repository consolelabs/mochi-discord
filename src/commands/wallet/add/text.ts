import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import { handleWalletAddition } from "./processor"

const command: Command = {
  id: "wallet_add",
  command: "add",
  brief: "Save your interested wallet address with an alias.",
  category: "Defi",
  run: async (msg) => {
    await handleWalletAddition(msg)
    return
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}wallet add`,
        examples: `${PREFIX}wallet add`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Wallet",
  minArguments: 2,
  allowDM: true,
}

export default command
