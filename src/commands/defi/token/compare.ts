import { Command } from "types/common"
import {
  HexColorString,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageSelectMenu,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { PREFIX } from "utils/constants"
import { getCommandArguments } from "utils/commands"
import {
  composeDiscordSelectionRow,
  composeDiscordExitButton,
  composeEmbedMessage,
  getErrorEmbed,
} from "utils/discordEmbed"
import Defi from "adapters/defi"
import dayjs from "dayjs"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import { getGradientColor, renderChartImage } from "utils/canvas"
export const coinNotFoundResponse = (msg: Message, coinQ: string) => ({
  messageOptions: {
    embeds: [
      getErrorEmbed({
        msg,
        description: `Cannot find any cryptocurrency with \`${coinQ}\`.\nPlease try again with the symbol or full name.`,
      }),
    ],
  },
})

function getChartColorConfig(id: string) {
  let gradientFrom, gradientTo, borderColor
  switch (id) {
    case "bitcoin":
      borderColor = "#ffa301"
      gradientFrom = "rgba(159,110,43,0.9)"
      gradientTo = "rgba(76,66,52,0.5)"
      break
    case "ethereum":
      borderColor = "#ff0421"
      gradientFrom = "rgba(173,36,43,0.9)"
      gradientTo = "rgba(77,48,53,0.5)"
      break

    case "tether":
      borderColor = "#22a07a"
      gradientFrom = "rgba(46,78,71,0.9)"
      gradientTo = "rgba(48,63,63,0.5)"
      break
    case "binancecoin" || "terra":
      borderColor = "#f5bc00"
      gradientFrom = "rgba(172,136,41,0.9)"
      gradientTo = "rgba(73,67,55,0.5)"
      break
    case "solana":
      borderColor = "#9945ff"
      gradientFrom = "rgba(116,62,184,0.9)"
      gradientTo = "rgba(61,53,83,0.5)"
      break
    default:
      borderColor = "#009cdb"
      gradientFrom = "rgba(53,83,192,0.9)"
      gradientTo = "rgba(58,69,110,0.5)"
  }

  return {
    borderColor,
    backgroundColor: getGradientColor(gradientFrom, gradientTo),
  }
}

async function renderCompareTokenChart({
  msg,
  baseCoinId,
  targetCoinId,
  days = 7,
}: {
  msg: Message
  baseCoinId: string
  targetCoinId: string
  days?: number
}) {
  const { times, price_compare } = await Defi.CompareToken(
    msg,
    baseCoinId,
    targetCoinId,
    days
  )

  // draw chart
  const colorConfig = getChartColorConfig(baseCoinId)
  const image = await renderChartImage({
    chartLabel: `Price (${"USD".toUpperCase()}), ${times[0]} - ${
      times[times.length - 1]
    }`,
    labels: times,
    data: price_compare,
    colorConfig,
  })

  return new MessageAttachment(image, "chart.png")
}

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const [baseCoinId, targetCoinId, days] = input.split("_")

  const chart = await renderCompareTokenChart({
    msg: message,
    baseCoinId,
    targetCoinId,
    days: +days,
  })

  // update chart image
  const [embed] = message.embeds
  await message.removeAttachments()
  embed.image.url = "attachment://chart.png"

  const selectMenu = message.components[0].components[0] as MessageSelectMenu
  const choices = ["1", "7", "30", "60", "90", "365"]
  selectMenu.options.forEach(
    (opt, i) => (opt.default = i === choices.indexOf(days))
  )

  return {
    messageOptions: {
      embeds: [embed],
      files: [chart],
      components: message.components as MessageActionRow[],
    },
    commandChoiceOptions: {
      handler,
      userId: message.author.id,
      messageId: message.id,
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      interaction,
    },
  }
}

async function composeTokenComparisonEmbed(
  msg: Message,
  baseCoinId: string,
  targetCoinId: string
) {
  const embedMsg = composeEmbedMessage(msg, {
    color: getChartColorConfig(baseCoinId).borderColor as HexColorString,
    author: [`Make comparison between ${baseCoinId} and ${targetCoinId}`],
    footer: ["Data fetched from CoinGecko.com"],
    image: "attachment://chart.png",
  })

  const chart = await renderCompareTokenChart({
    msg,
    baseCoinId: baseCoinId,
    targetCoinId: targetCoinId,
    days: 7,
  })

  const getDropdownOptionDescription = (days: number) =>
    `${Defi.getDateStr(
      dayjs().subtract(days, "day").unix() * 1000
    )} - ${Defi.getDateStr(dayjs().unix() * 1000)}`

  const opt = (days: number): MessageSelectOptionData => ({
    label: `${days === 365 ? "1 year" : `${days} day${days > 1 ? "s" : ""}`}`,
    value: `${baseCoinId}_${targetCoinId}_${days}`,
    emoji: days > 1 ? "📆" : "🕒",
    description: getDropdownOptionDescription(days),
    default: days === 7,
  })
  const selectRow = composeDiscordSelectionRow({
    customId: "tickers_range_selection",
    placeholder: "Make a selection",
    options: [opt(1), opt(7), opt(14), opt(30), opt(90)],
  })

  return {
    messageOptions: {
      files: [chart],
      embeds: [embedMsg],
      components: [selectRow, composeDiscordExitButton(msg.author.id)],
    },
    commandChoiceOptions: {
      userId: msg.author.id,
      guildId: msg.guildId,
      channelId: msg.channelId,
      handler,
    },
  }
}

const command: Command = {
  id: "tokens_compare",
  command: "compare",
  brief: "View comparison between 2 tokens",
  category: "Defi",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    if (args.length < 3) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }

    const [query] = args.slice(2)
    const [baseQ, targetQ] = query.split("/")

    return await composeTokenComparisonEmbed(msg, baseQ, targetQ)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens compare`,
        examples: `${PREFIX}tokens compare bitcoin/binancecoin`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
}

export default command
