import defi from "adapters/defi"
import {
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageComponentInteraction,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { InternalError, OriginalMessage } from "errors"
import CacheManager from "cache/node-cache"
import { InteractionHandler } from "handlers/discord/select-menu"
import { getEmoji } from "utils/common"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { renderCompareTokenChart } from "../compare-token/processor"
import { composeDaysSelectMenu } from "ui/discord/select-menu"
import { composeDiscordExitButton } from "ui/discord/button"

export async function composeFiatComparisonEmbed(
  message: OriginalMessage,
  base: string,
  target: string
) {
  const msg = message instanceof Message ? message : undefined
  const interaction =
    message instanceof CommandInteraction
      ? <CommandInteraction>message
      : <MessageComponentInteraction>message
  const authorId = msg?.author.id ?? interaction.user.id
  const { ok, data } = await CacheManager.get({
    pool: "ticker",
    key: `comparefiat-${base}-${target}-30`,
    call: () => defi.getFiatHistoricalData({ base, target }),
  })
  if (!ok) {
    throw new InternalError({
      title: "Unsupported token/fiat",
      msgOrInteraction: msg,
      description: `Token is invalid or hasn't been supported.\n${getEmoji(
        "ANIMATED_POINTING_RIGHT", true
      )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
        "ANIMATED_POINTING_RIGHT", true
      )} or Please choose a valid fiat currency.`,
    })
  }

  const { times, rates: ratios, latest_rate, from, to } = data
  const embed = composeEmbedMessage(msg, {
    author: [`${base.toUpperCase()} vs. ${target.toUpperCase()}`],
    image: "attachment://chart.png",
    description: `**Current rate:** \`${latest_rate}\``,
  })

  const chart = await renderCompareTokenChart({
    times,
    ratios,
    chartLabel: `Exchange rates | ${from} - ${to}`,
  })
  const selectRow = composeDaysSelectMenu(
    "compare_fiat_selection",
    `${base}_${target}`,
    [7, 30, 90, 180, 365],
    30
  )

  return {
    messageOptions: {
      ...(chart && { files: [chart] }),
      embeds: [embed],
      components: [selectRow, composeDiscordExitButton(authorId)],
    },
    interactionOptions: {
      handler,
    },
  }
}

const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  await interaction.deferUpdate()
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const [base, target, days] = input.split("_")
  if (!message.guildId) {
    return { messageOptions: { embeds: [getErrorEmbed({ msg: message })] } }
  }
  const { ok, data } = await CacheManager.get({
    pool: "ticker",
    key: `comparefiat-${base}-${target}-${days}`,
    call: () => defi.getFiatHistoricalData({ base, target, days }),
  })
  if (!ok) {
    await message.removeAttachments()
    return {
      messageOptions: { embeds: [getErrorEmbed({ msg: message })] },
    }
  }

  const { times, rates: ratios, from, to } = data
  const chart = await renderCompareTokenChart({
    times,
    ratios,
    chartLabel: `Exchange rates | ${from} - ${to}`,
  })

  // update chart image
  await message.removeAttachments()
  const [embed] = message.embeds
  embed.setImage("attachment://chart.png")

  const selectMenu = message.components[0].components[0] as MessageSelectMenu
  const choices = ["7", "30", "90", "180", "365"]
  selectMenu.options.forEach(
    (opt, i) => (opt.default = i === choices.indexOf(days))
  )

  return {
    messageOptions: {
      embeds: [embed],
      ...(chart && { files: [chart] }),
      components: message.components as MessageActionRow[],
    },
    interactionOptions: {
      handler,
    },
  }
}
