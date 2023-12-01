import Defi from "adapters/defi"
import { MessageSelectOptionData } from "discord.js"
import { Command } from "types/common"
import { PREFIX, PRICE_ALERT_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { handler } from "./processor"
import { composeDiscordExitButton } from "ui/discord/button"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { APIError } from "errors"
import { msgColors } from "utils/common"

const command: Command = {
  id: "alert_remove",
  command: "remove",
  brief: "Remove the price alert",
  category: "Defi",
  run: async function (msg) {
    const {
      ok,
      data,
      log,
      curl,
      status = 500,
      error,
    } = await Defi.getAlertList(msg.author.id)
    if (!ok) {
      throw new APIError({
        msgOrInteraction: msg,
        description: log,
        curl,
        status,
        error,
      })
    }

    if (data.length === 0) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "No price alerts found",
              description: `You haven't set up any price alerts. To set up a new alert, you can use \`$alert add <token_symbol>\`.`,
            }),
          ],
        },
      }
    }

    const options: MessageSelectOptionData[] = []
    data.forEach((alert: any) => {
      const label =
        alert.symbol +
          " " +
          alert.alert_type.replaceAll("_", " ") +
          " " +
          alert.value ?? ""
      const value = `${alert.id ?? ""}`
      options.push({
        label,
        value,
      })
    })

    const embed = composeEmbedMessage(msg, {
      title: "Select an alert to remove",
      color: msgColors.PINK,
    })

    return {
      messageOptions: {
        embeds: [embed],
        components: [
          composeDiscordSelectionRow({
            customId: "alert_remove",
            placeholder: "Select an alert",
            options,
          }),
          composeDiscordExitButton(msg.author.id),
        ],
      },
      interactionOptions: {
        handler,
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}alert remove`,
        examples: `${PREFIX}alert remove`,
        document: `${PRICE_ALERT_GITBOOK}&action=remove`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
