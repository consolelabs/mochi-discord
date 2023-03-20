import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import { run } from "./processor"
import { getCommandArguments } from "utils/commands"
import { isValidAmount } from "utils/common"
import { CommandArgumentError } from "errors"
import { Message } from "discord.js"
import { Command } from "types/common"
import { parseMessageTip } from "commands/new-tip/index/processor"

const cmd: Command = {
  id: "pay",
  command: "pay",
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
    const { messageTip: note } = await parseMessageTip(args)
    await run({
      msgOrInteraction: msg,
      amount: +amount,
      token: token.toUpperCase(),
      note,
    })
  },
  getHelpMessage: async (msg: Message) => ({
    embeds: [
      composeEmbedMessage(msg, {
        title: "Payment",
        usage: `${PREFIX}pay link <amount> <token> [message]`,
        examples: `${PREFIX}pay link 0.1 ftm "I want to thank you for a great collaboration"`,
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
