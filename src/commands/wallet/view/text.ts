import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getCommandArguments } from "utils/commands"
import { resolveNamingServiceDomain } from "utils/common"
import { PREFIX } from "utils/constants"
import { viewWalletDetails, viewWalletsList } from "./processor"

const command: Command = {
  id: "wallet_view",
  command: "view",
  brief: "Show all your interested wallets assets and activities.",
  category: "Defi",
  run: async (msg) => {
    const args = getCommandArguments(msg)
    const { author } = msg
    // view list
    if (args.length === 2) {
      return await viewWalletsList(msg, author)
    }
    // view one
    const query = args[2]
    const addressOrAlias = (await resolveNamingServiceDomain(query)) || query
    return await viewWalletDetails(msg, author, addressOrAlias)
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
  colorType: "Wallet",
  minArguments: 2,
  allowDM: true,
}

export default command
