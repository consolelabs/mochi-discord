import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import { run } from "./processor"
import { getCommandArguments } from "utils/commands"
import { isValidAmount, TokenEmojiKey } from "utils/common"
import { CommandArgumentError } from "errors"
import { Message } from "discord.js"
import { Command } from "types/common"
import { parseMessageTip } from "../../../utils/tip-bot"

const cmd: Command = {
  id: "wallet_new",
  command: "new",
  brief: "Generate a pay link which can be used by others to claim tip.",
  category: "Defi",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    const [amount, token] = args.slice(2)
    if (!isValidAmount({ arg: amount })) {
      throw new CommandArgumentError({
        message: msg,
        getHelpMessage: async () => this.getHelpMessage(msg),
      })
    }
    const note = await parseMessageTip(args, 4)
    await run({
      msgOrInteraction: msg,
      amount: +amount,
      token: token.toUpperCase() as TokenEmojiKey,
      note,
    })
  },
  getHelpMessage: async (msg: Message) => ({
    embeds: [
      composeEmbedMessage(msg, {
        title: "Payment",
        usage: `${PREFIX}wallet new <amount> <token> [message]`,
        examples: `${PREFIX}wallet new 0.1 ftm "I want to thank you for a great collaboration"`,
        description: "Generate pay links to share with others.",
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Wallet",
  canRunWithoutAction: false,
  allowDM: true,
  minArguments: 4,
}

export default cmd
