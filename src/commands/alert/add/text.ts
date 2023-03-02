import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX, PRICE_ALERT_GITBOOK } from "utils/constants"
import * as processor from "./processor"

const command: Command = {
  id: "alert_add",
  command: "add",
  brief: "Add a price alert to be notified when the price change",
  category: "Config",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const symbol = args[2] ?? ""
    return await processor.handlePriceAlertAdd(msg, symbol)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}alert add <token>`,
          examples: `${PREFIX}alert add ftm`,
          document: `${PRICE_ALERT_GITBOOK}&action=add`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
