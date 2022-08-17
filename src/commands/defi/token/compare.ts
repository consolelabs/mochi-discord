import { Command } from "types/common"
import {
  HexColorString,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { getCommandArguments } from "utils/commands"
import {
  composeDiscordExitButton,
  composeEmbedMessage,
  getErrorEmbed,
  composeDaysSelectMenu,
} from "utils/discordEmbed"
import Defi from "adapters/defi"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import { getChartColorConfig, renderChartImage } from "utils/canvas"
import { Coin } from "types/defi"
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

async function renderCompareTokenChart({
  times,
  ratios,
}: {
  times: string[]
  ratios: number[]
}) {
  const image = await renderChartImage({
    chartLabel: `Price (${"USD".toUpperCase()}), ${times[0]} - ${
      times[times.length - 1]
    }`,
    labels: times,
    data: ratios,
  })

  return new MessageAttachment(image, "chart.png")
}

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const [baseCoinId, targetCoinId, days] = input.split("_")

  const { times, ratios } = await Defi.CompareToken(
    message,
    baseCoinId,
    targetCoinId,
    +days
  )

  const chart = await renderCompareTokenChart({ times, ratios })

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
  const { times, ratios, base_coin, target_coin } = await Defi.CompareToken(
    msg,
    baseCoinId,
    targetCoinId,
    7
  )

  const coinInfo = (coin: Coin) =>
    `Rank: \`#${coin.market_cap_rank}\``
      .concat(
        `\nPrice: \`$${coin.market_data.current_price[
          "usd"
        ].toLocaleString()}\``
      )
      .concat(
        `\nMarket cap: \`$${coin.market_data.market_cap[
          "usd"
        ].toLocaleString()}\``
      )

  const embedMsg = composeEmbedMessage(msg, {
    color: getChartColorConfig(baseCoinId).borderColor as HexColorString,
    author: [`${base_coin.name} vs. ${target_coin.name}`],
    footer: ["Data fetched from CoinGecko.com"],
    image: "attachment://chart.png",
  })
    .addField(base_coin.name, coinInfo(base_coin), true)
    .addField(target_coin.name, coinInfo(target_coin), true)

  const chart = await renderCompareTokenChart({ times, ratios })
  const selectRow = composeDaysSelectMenu(
    "compare_token_selection",
    `${baseCoinId}_${targetCoinId}`,
    [1, 7, 14, 30, 90]
  )

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
    const [query] = args.slice(1)
    const [baseQ, targetQ] = query.split("/")
    return await composeTokenComparisonEmbed(msg, baseQ, targetQ)
  },
  getHelpMessage: async () => null,
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
