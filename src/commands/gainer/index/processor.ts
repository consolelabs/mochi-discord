import defi from "adapters/defi"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  msgColors,
  roundFloatNumber,
} from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage, justifyEmbedFields } from "ui/discord/embed"
import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  ButtonInteraction,
} from "discord.js"

const timeRangeType = ["1h", "24h", "7d", "1y"]

export async function handleGainerView(i: ButtonInteraction) {
  if (!i.deferred) {
    await i.deferUpdate()
  }
  const [, view] = i.customId.split("_")

  const { data, ok, curl, error, log } = await defi.getTopGainerLoser({
    duration: `${view}`,
  })
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (!data || data.top_gainers.length === 0) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No gainer token now!",
            description: `${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} Currently no token found`,
            color: msgColors.SUCCESS,
          }),
        ],
      },
    }
  }

  const missingButton = timeRangeType.filter((t) => t !== view)

  i.editReply({
    embeds: [switchView(view as any, data)],
    components: [
      new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setStyle("SECONDARY")
            .setCustomId(`gainer-view_${missingButton[0]}`)
            .setLabel(`${missingButton[0]}`)
        )
        .addComponents(
          new MessageButton()
            .setStyle("SECONDARY")
            .setCustomId(`gainer-view_${missingButton[1]}`)
            .setLabel(`${missingButton[1]}`)
        )
        .addComponents(
          new MessageButton()
            .setStyle("SECONDARY")
            .setCustomId(`gainer-view_${missingButton[2]}`)
            .setLabel(`${missingButton[2]}`)
        ),
    ],
  })
}

function switchView(view: "24h" | "1h" | "7d", data: any) {
  return buildEmbed(data, view)
}

function buildEmbed(data: any, timeRange: string) {
  let longestStrLen = 0
  const description = data.top_gainers
    .slice(0, 10)
    .map((coin: any) => {
      const changePercentage = roundFloatNumber(
        coin[`usd_${timeRange}_change`],
        2
      )

      const text = `${coin.name} (${coin.symbol})`
      longestStrLen = Math.max(longestStrLen, text.length)
      const currentPrice = roundFloatNumber(coin.usd, 4)

      return {
        text,
        changePercentage,
        current_price: currentPrice,
      }
    })
    .map((coin: any) => {
      const direction = coin.changePercentage > 0 ? "Up" : "Down"
      return `\`${coin.text}${" ".repeat(
        longestStrLen - coin.text.length
      )} => $${coin.current_price}. ${direction}: ${coin.changePercentage}%\``
    })
    .join("\n")

  const embed = composeEmbedMessage(null, {
    color: msgColors.BLUE,
    description,
    author: ["Top gainers", getEmojiURL(emojis.ANIMATED_FIRE)],
  })
  return embed
}

export async function render(i: CommandInteraction) {
  const timeRange = i.options.getString("time", true)

  const { data, ok, curl, error, log } = await defi.getTopGainerLoser({
    duration: `${timeRange}`,
  })
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (!data || data.top_gainers.length === 0) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No gainer token now!",
            description: `${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} Currently no token found`,
            color: msgColors.SUCCESS,
          }),
        ],
      },
    }
  }

  const missingButton = timeRangeType.filter((t) => t !== timeRange)

  const embed = buildEmbed(data, timeRange)
  justifyEmbedFields(embed, 3)

  return {
    messageOptions: {
      embeds: [switchView(timeRange as any, data)],
      components: [
        new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setStyle("SECONDARY")
              .setCustomId(`gainer-view_${missingButton[0]}`)
              .setLabel(`${missingButton[0]}`)
          )
          .addComponents(
            new MessageButton()
              .setStyle("SECONDARY")
              .setCustomId(`gainer-view_${missingButton[1]}`)
              .setLabel(`${missingButton[1]}`)
          )
          .addComponents(
            new MessageButton()
              .setStyle("SECONDARY")
              .setCustomId(`gainer-view_${missingButton[2]}`)
              .setLabel(`${missingButton[2]}`)
          ),
      ],
    },
  }
}
