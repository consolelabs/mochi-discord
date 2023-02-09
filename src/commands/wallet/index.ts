import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import view from "./view/text"
import add from "./add/text"
import remove from "./remove/text"

const actions: Record<string, Command> = {
  view,
  add,
  remove,
}

const textCmd: Command = {
  id: "wallet",
  command: "wallet",
  brief: "",
  category: "Defi",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        title: "On-chain Wallet Tracking",
        usage: `${PREFIX}wallet <action>`,
        examples: `${PREFIX}wallet add 0xfBe6403a719d0572Ea4BA0E1c01178835b1D3bE4 mywallet\n${PREFIX}wallet view`,
        description: "Track assets and activities of any on-chain wallet.",
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  aliases: ["wal"],
  colorType: "Defi",
  canRunWithoutAction: false,
}

export default { textCmd }
