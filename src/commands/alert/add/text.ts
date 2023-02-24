import { Message, SelectMenuInteraction } from "discord.js"
import { APIError } from "errors"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { getEmoji } from "utils/common"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import { InteractionHandler } from "handlers/discord/select-menu"
import { PREFIX, PRICE_ALERT_GITBOOK } from "utils/constants"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { composeDiscordExitButton } from "ui/discord/button"
import Defi from "../../../adapters/defi"
import { Token } from "types/defi"

const command: Command = {
  id: "alert_add",
  command: "add",
  brief: "Add a price alert to be notified when the price change",
  category: "Config",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const symbol = args[2] ?? ""

    const tokens = await Defi.getSupportedTokens()

    let isTokenSupported = false
    let tokenName = ""
    tokens.forEach((token: Token) => {
      if (token.symbol.toUpperCase() === symbol.toUpperCase()) {
        isTokenSupported = true
        tokenName = token.coin_gecko_id
      }
    })
    if (!isTokenSupported) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: `${getEmoji("revoke")} Unsupported token`,
              description: `
              **${symbol.toUpperCase()}** is invalid or hasn't been supported.
              ${getEmoji(
                "point_right"
              )} Please choose a token that is listed on [Coingecko](coingecko.com)
              `,
            }),
          ],
        },
      }
    }
    const selectRow = composeDiscordSelectionRow({
      customId: "alert_add_alert_type",
      placeholder: `Choose the price alert`,
      options: [
        {
          label: "Price reaches",
          value: `price_reaches-${symbol}-${tokenName}-${msg.author.id}`,
        },
        {
          label: "Price rises above",
          value: `price_rises_above-${symbol}-${tokenName}-${msg.author.id}`,
        },
        {
          label: "Price drops to",
          value: `price_drops_to-${symbol}-${tokenName}-${msg.author.id}`,
        },
        {
          label: "Change is over",
          value: `change_is_over-${symbol}-${tokenName}-${msg.author.id}`,
        },
        {
          label: "Change is under",
          value: `change_is_under-${symbol}-${tokenName}-${msg.author.id}`,
        },
      ],
    })
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: `${getEmoji("increasing")} Please choose the price alert`,
          }),
        ],
        components: [selectRow, composeDiscordExitButton(msg.author.id)],
      },
      interactionOptions: { handler: handlerAlertType },
    }
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

const handlerAlertType: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const input = interaction.values[0]
  const [alertType, symbol, coinId, userID] = input.split("-")

  const { ok, data, log, curl } = await Defi.getCoin(coinId)
  if (!ok) {
    throw new APIError({ description: log, curl })
  }

  let title = `${getEmoji("increasing")} Please enter the value in USD`
  let description = `The current price of **${
    symbol ? symbol.toUpperCase() : ""
  }** is ${data.market_data.current_price.usd}. `
  if (alertType === "price_rises_above") {
    description += "Please enter a higher price than the current one!"
  }
  if (alertType === "price_drops_to") {
    description += "Please enter a lower price than the current one!"
  }
  if (alertType === "change_is_over" || alertType === "change_is_under") {
    title = `${getEmoji("increasing")} Please enter the value in percentage (%)`
    description += `You will get alert if ${alertType.replaceAll("_", " ")}:`
  }

  await interaction.update({
    embeds: [
      composeEmbedMessage(null, {
        title,
        description,
      }),
    ],
    components: [],
  })
  const filter = (collected: Message) =>
    collected.author.id === interaction.user.id
  const collected = await interaction.channel?.awaitMessages({
    max: 1,
    filter,
  })
  const amountStr = collected?.first()?.content?.trim() ?? ""
  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: `${getEmoji("revoke")} Invalid value`,
            description:
              "The value is invalid. Please insert a positive number.",
          }),
        ],
        components: [],
      },
    }
  }

  if (
    alertType === "price_drops_to" &&
    amount >= data.market_data.current_price.usd
  ) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: `${getEmoji("revoke")} Invalid value`,
            description: `To get the notification when the price drops, you have to enter a lower value than the current one (${data.market_data.current_price.usd}).`,
          }),
        ],
        components: [],
      },
    }
  }

  if (
    alertType === "price_rises_above" &&
    amount <= data.market_data.current_price.usd
  ) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: `${getEmoji("revoke")} Invalid value`,
            description: `To get the notification when the price rises, you have to enter a higher value than the current one (${data.market_data.current_price.usd}).`,
          }),
        ],
        components: [],
      },
    }
  }
  const selectRow = composeDiscordSelectionRow({
    customId: "alert_add_frequency",
    placeholder: `Please choose the price alert frequency`,
    options: [
      {
        label: "Only Once",
        value: `only_once-${amount}-${alertType}-${symbol}-${userID}`,
      },
      {
        label: "Once a day",
        value: `once_a_day-${amount}-${alertType}-${symbol}-${userID}`,
      },
      {
        label: "Always",
        value: `always-${amount}-${alertType}-${symbol}-${userID}`,
      },
    ],
  })

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: `${getEmoji("increasing")} Please choose the alert frequency`,
        }),
      ],
      components: [selectRow, composeDiscordExitButton(userID)],
    },
    interactionOptions: { handler: handleFrequency },
  }
}

const handleFrequency: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const input = interaction.values[0]
  const [frequency, amount, alertType, symbol, userDiscordId] = input.split("-")

  const price = +amount

  const { ok, log, curl } = await Defi.addAlertPrice({
    userDiscordId,
    symbol,
    alertType,
    frequency,
    price,
  })

  if (!ok) {
    throw new APIError({ description: log, curl })
  }

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Successfully added a price alert",
          description: `You will get the notification in DM if ${symbol} ${alertType.replaceAll(
            "_",
            " "
          )} ${price}`,
        }),
      ],
      components: [],
    },
  }
}

export default command
