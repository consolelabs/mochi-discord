import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { untrackWallet } from "./processor"
import { resolveNamingServiceDomain } from "utils/common"

const command: Command = {
  id: "wallet_remove",
  command: "remove",
  brief: "Remove the wallet address from your interested list.",
  category: "Defi",
  run: async (msg) => {
    const args = getCommandArguments(msg)
    const query = args[2]
    const addressOrAlias = (await resolveNamingServiceDomain(query)) || query
    return await untrackWallet(msg, msg.author, addressOrAlias)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}wallet remove <address>/<alias>`,
        examples: `${PREFIX}wallet remove 0xfBe6403a719d0572Ea4BA0E1c01178835b1D3bE4\n${PREFIX}wallet remove mywallet`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Wallet",
  minArguments: 3,
  allowDM: true,
}

export default command
