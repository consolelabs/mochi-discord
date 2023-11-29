import { CommandInteraction, SelectMenuInteraction } from "discord.js"
import { Message } from "discord.js"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import { getEmoji } from "utils/common"
import Defi from "../../../adapters/defi"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { composeDiscordExitButton } from "ui/discord/button"
import { InteractionHandler } from "handlers/discord/select-menu"
import { APIError } from "errors"
import { logger } from "logger"

export const handlePriceAlertAdd = async (
  msgOrInteraction: Message | CommandInteraction,
  symbol: string,
) => {
  const authorId =
    msgOrInteraction instanceof Message
      ? msgOrInteraction.author.id
      : msgOrInteraction.user.id
  const { ok } = await Defi.getBinanceCoinPrice(symbol)
  if (!ok) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: "Unsupported token",
            description: `
              **${symbol.toUpperCase()}** is invalid or hasn't been supported.
              ${getEmoji(
                "ANIMATED_POINTING_RIGHT",
              )} Please choose a token that is listed on [Binance Exchange](binance.com)
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
        value: `price_reaches-${symbol}-${authorId}`,
      },
      {
        label: "Price rises above",
        value: `price_rises_above-${symbol}-${authorId}`,
      },
      {
        label: "Price drops to",
        value: `price_drops_to-${symbol}-${authorId}`,
      },
      {
        label: "Change is over",
        value: `change_is_over-${symbol}-${authorId}`,
      },
      {
        label: "Change is under",
        value: `change_is_under-${symbol}-${authorId}`,
      },
    ],
  })

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: `${getEmoji(
            "ANIMATED_CHART_INCREASE",
            true,
          )} Please choose the price alert`,
        }),
      ],
      components: [selectRow, composeDiscordExitButton(authorId)],
    },
    interactionOptions: { handler: handlerAlertType },
  }
}

const handlerAlertType: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const input = interaction.values[0]
  const [alertType, symbol, userID] = input.split("-")

  const {
    ok,
    data,
    log,
    curl,
    status = 500,
  } = await Defi.getBinanceCoinPrice(symbol)
  if (!ok) {
    throw new APIError({ description: log, curl, status })
  }
  const currentPrice = parseFloat(data?.price)
  let title = `${getEmoji(
    "ANIMATED_CHART_INCREASE",
    true,
  )} Please enter the value in USD`
  let description = `The current price of **${
    symbol ? symbol.toUpperCase() : ""
  }** is ${currentPrice}. `
  if (alertType === "price_rises_above") {
    description += "Please enter a higher price than the current one!"
  }
  if (alertType === "price_drops_to") {
    description += "Please enter a lower price than the current one!"
  }
  if (alertType === "change_is_over" || alertType === "change_is_under") {
    title = `${getEmoji(
      "ANIMATED_CHART_INCREASE",
      true,
    )} Please enter the value in percentage (%)`
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
          getErrorEmbed({
            title: "Invalid alert value",
            description:
              "The value is invalid. Please insert a positive number.",
          }),
        ],
        components: [],
      },
    }
  }

  if (collected?.first()) {
    await interaction.channel?.messages
      .delete(collected?.first() as Message<boolean>)
      .catch((e) => logger.error(e))
  }

  if (alertType === "price_drops_to" && amount >= currentPrice) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: "Invalid alert value",
            description: `To get the notification when the price drops, you have to enter a lower value than the current one (${currentPrice}).`,
          }),
        ],
        components: [],
      },
    }
  }

  if (
    ["price_rises_above", "price_reaches"].includes(alertType) &&
    amount <= currentPrice
  ) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: "Invalid alert value",
            description: `To get the notification when the price rises, you have to enter a higher value than the current one (${currentPrice}).`,
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
          title: `${getEmoji(
            "ANIMATED_CHART_INCREASE",
            true,
          )} Please choose the alert frequency`,
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

  const isPercentageValue = ["change_is_over", "change_is_under"].includes(
    alertType,
  )
  const value = +amount

  const {
    ok,
    log,
    curl,
    status = 500,
  } = await Defi.addAlertPrice({
    userDiscordId,
    symbol,
    alertType,
    frequency,
    value,
  })

  if (!ok) {
    throw new APIError({ description: log, curl, status })
  }

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Successfully added a price alert",
          description: `You will get a DM if **${symbol.toUpperCase()}**'s price ${alertType.replaceAll(
            "_",
            " ",
          )} ${value}${isPercentageValue ? "%" : ""}`,
        }),
      ],
      components: [],
    },
  }
}
