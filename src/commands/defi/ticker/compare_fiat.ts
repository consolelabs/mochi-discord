import defi from "adapters/defi"
import {
  Message,
  MessageActionRow,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { CommandArgumentError } from "errors"
import { Command } from "types/common"
import CacheManager from "utils/CacheManager"
import { getCommandArguments } from "utils/commands"
import { DEFI_DEFAULT_FOOTER, PREFIX, TICKER_GITBOOK } from "utils/constants"
import { parseFiatQuery } from "utils/defi"
import {
  composeDaysSelectMenu,
  composeDiscordExitButton,
  composeEmbedMessage,
  getErrorEmbed,
} from "utils/discordEmbed"
import { InteractionHandler } from "utils/InteractionManager"
import { renderCompareTokenChart } from "./compare"

async function composeFiatComparisonEmbed(
  msg: Message,
  base: string,
  target: string
) {
  if (!msg.guildId) {
    return {
      messageOptions: { embeds: [getErrorEmbed({ msg })] },
    }
  }
  const { ok, data } = await CacheManager.get({
    pool: "ticker",
    key: `comparefiat-${base}-${target}-30`,
    call: () => defi.getFiatHistoricalData({ base, target }),
  })
  if (!ok) {
    return {
      messageOptions: { embeds: [getErrorEmbed({ msg })] },
    }
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
      components: [selectRow, composeDiscordExitButton(msg.author.id)],
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

const command: Command = {
  id: "ticker_compare_fiat",
  command: "compare",
  brief: "Fiat historical exchange rates",
  category: "Defi",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const [query] = args.slice(1)
    const [base, target] = parseFiatQuery(query)
    if (!base) {
      throw new CommandArgumentError({
        message: msg,
        description: "Base and target currencies cannot be the same",
        getHelpMessage: () => this.getHelpMessage(msg),
      })
    }
    return await composeFiatComparisonEmbed(msg, base, target)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        description: "**Error**: Base and target currencies cannot be the same",
        usage: `${PREFIX}ticker <base>/<target> (default target = usd)`,
        examples: `${PREFIX}ticker eur\n${PREFIX}ticker gbp/sgd`,
        document: TICKER_GITBOOK,
        footer: [DEFI_DEFAULT_FOOTER],
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
