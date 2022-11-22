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
    key: `comparefiat-${base}-${target}-7`,
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
    [7, 30, 90, 180, 365]
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
  brief: "View comparison between 2 fiat currencies",
  category: "Defi",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const [query] = args.slice(1)
    let [base, target] = query.split("/")
    if (!target) {
      switch (base.length) {
        case 3:
          target = "usd"
          break
        case 6:
          ;[base, target] = [base.slice(0, 3), base.slice(3)]
          break
        default:
          throw new CommandArgumentError({
            message: msg,
            description: "Fiat not supported",
            getHelpMessage: () => this.getHelpMessage(msg),
          })
      }
    }
    if (base === target) {
      throw new CommandArgumentError({
        message: msg,
        description: "Base and target currencies cannot be the same",
        getHelpMessage: () => this.getHelpMessage(msg),
      })
    }
    return await composeFiatComparisonEmbed(msg, base, target)
  },
  getHelpMessage: async () => {
    return {}
  },
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
