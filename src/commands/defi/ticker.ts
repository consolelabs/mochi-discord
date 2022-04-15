import { Command } from "types/common"
import {
  HexColorString,
  Message,
  MessageActionRow,
  MessageEmbed,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { PREFIX } from "env"
import {
  composeDiscordExitButton,
  composeDiscordSelectionRow,
  getEmbedFooter,
  getEmoji,
  getHeader,
  getHelpEmbed,
  roundFloatNumber,
  thumbnails,
} from "utils/discord"
import Social from "modules/social"
import dayjs from "dayjs"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"

const numberWithCommas = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")

const getChangePercentage = (change: number) => {
  const trend = change > 0 ? "📈" : change === 0 ? "" : "📉"
  return `${trend} ${change > 0 ? "+" : ""}${roundFloatNumber(change, 2)}%`
}

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = interaction
  const input = interaction.values[0]
  const [id, currency, days] = input.split("_")

  const chart = await Social.renderHistoricalMarketChart({
    msg: message as Message,
    id,
    currency,
    days: +days,
  })

  message.embeds[0].image.url = "attachment://chart.png"
  const selectMenu = message.components[0].components[0] as MessageSelectMenu
  const choices = ["1", "7", "30", "60", "90", "365"]
  selectMenu.options.forEach(
    (opt, i) => (opt.default = i === choices.indexOf(days))
  )

  return {
    messageOptions: {
      embeds: message.embeds,
      files: [chart],
      components: message.components as MessageActionRow[],
      content: message.content,
    },
  }
}

const command: Command = {
  id: "ticker",
  command: "ticker",
  name: "Ticker",
  category: "Defi",
  run: async function (msg) {
    const args = msg.content.split(" ")
    const query = !args[1].includes("/") ? `${args[1]}/usd` : args[1]
    const [coinId, currency] = query.split("/")
    const coin = await Social.getCoinCurrentData(msg, coinId)
    const { market_data } = coin
    const blank = getEmoji("blank")

    const embedMsg = new MessageEmbed()
      .setColor(
        Social.getChartColorConfig(coin.id, 0, 0).borderColor as HexColorString
      )
      .setAuthor(coin.name, coin.image.small)
      .setFooter(
        getEmbedFooter(["Data fetched from CoinGecko.com"]),
        msg.author.avatarURL()
      )
      .setTimestamp()
      .addField(
        `Market cap (${currency.toUpperCase()})`,
        `${numberWithCommas(
          market_data.market_cap[currency.toLowerCase()] ??
            market_data.market_cap["usd"]
        )} (#${coin.market_cap_rank}) ${blank}`,
        true
      )
      .addField(
        `Price (${currency.toUpperCase()})`,
        `${numberWithCommas(
          market_data.current_price[currency.toLowerCase()] ??
            market_data.current_price["usd"]
        )}`,
        true
      )
      .addField("\u200B", "\u200B", true)
      .addField(
        "Change (1h)",
        getChangePercentage(
          market_data.price_change_percentage_1h_in_currency.usd
        ),
        true
      )
      .addField(
        `Change (24h) ${blank}`,
        getChangePercentage(
          market_data.price_change_percentage_24h_in_currency.usd
        ),
        true
      )
      .addField(
        "Change (7d)",
        getChangePercentage(
          market_data.price_change_percentage_7d_in_currency.usd
        ),
        true
      )

    const chart = await Social.renderHistoricalMarketChart({
      msg,
      id: coin.id,
      currency,
    })
    embedMsg.setImage("attachment://chart.png")

    const getDropdownOptionDescription = (daysAgo: number) =>
      `${Social.getDateStr(
        dayjs().subtract(daysAgo, "day").unix() * 1000
      )} - ${Social.getDateStr(dayjs().unix() * 1000)}`
    const selectRow = composeDiscordSelectionRow({
      customId: "ticker_view_option",
      placeholder: "Make a selection",
      options: [
        {
          label: "1 day",
          value: `${coin.id}_${currency}_1`,
          emoji: "🕒",
          description: getDropdownOptionDescription(1),
        },
        {
          label: "7 days",
          value: `${coin.id}_${currency}_7`,
          emoji: "📆",
          default: true,
          description: getDropdownOptionDescription(7),
        },
        {
          label: "30 days",
          value: `${coin.id}_${currency}_30`,
          emoji: "📆",
          description: getDropdownOptionDescription(30),
        },
        {
          label: "60 days",
          value: `${coin.id}_${currency}_60`,
          emoji: "📆",
          description: getDropdownOptionDescription(60),
        },
        {
          label: "90 days",
          value: `${coin.id}_${currency}_90`,
          emoji: "📆",
          description: getDropdownOptionDescription(90),
        },
        {
          label: "1 year",
          value: `${coin.id}_${currency}_365`,
          emoji: "📆",
          description: getDropdownOptionDescription(365),
        },
      ],
    })

    const exitBtnRow = composeDiscordExitButton()

    return {
      messageOptions: {
        files: [chart],
        embeds: [embedMsg],
        components: [selectRow, exitBtnRow],
        content: getHeader("View historical market chart", msg.author),
      },
      commandChoiceOptions: {
        userId: msg.author.id,
        guildId: msg.guildId,
        channelId: msg.channelId,
        timeout: this.inactivityTimeout,
        handler,
      },
    }
  },
  getHelpMessage: async () => {
    const embedMsg = getHelpEmbed("Ticker")
      .setThumbnail(thumbnails.TOKENS)
      .setTitle(`${PREFIX}ticker`)
      .addField(
        "_Examples_",
        `\`${PREFIX}ticker fantom\` or \`${PREFIX}ticker ftm\``
      )
      .setDescription(
        `\`\`\`Display coin price and market cap.\nData is fetched from [CoinGecko](https://coingecko.com/)\`\`\``
      )
    return { embeds: [embedMsg] }
  },
  alias: ["tick"],
  canRunWithoutAction: true,
  isComplexCommand: true,
}

export default command
