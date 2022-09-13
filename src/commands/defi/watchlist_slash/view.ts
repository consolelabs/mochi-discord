import { SlashCommand } from "types/common"
import { CommandInteraction, MessageAttachment } from "discord.js"
import { getPaginationFooter, thumbnails } from "utils/common"
import { getErrorEmbed, composeEmbedMessage2 } from "utils/discordEmbed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import defi from "adapters/defi"
import { createCanvas, loadImage, registerFont } from "canvas"
import { RectangleStats } from "types/canvas"
import {
  drawRectangle,
  heightOf,
  renderChartImage,
  widthOf,
} from "utils/canvas"
import CacheManager from "utils/CacheManager"

let fontRegistered = false

async function renderWatchlist(data: any[]) {
  if (!fontRegistered) {
    registerFont("src/assets/fonts/inter/Inter-Regular.ttf", {
      family: "Inter",
    })
    registerFont("src/assets/fonts/inter/Inter-Bold.ttf", {
      family: "Inter",
      weight: "bold",
    })
    fontRegistered = true
  }
  const container: RectangleStats = {
    x: {
      from: 0,
      to: 900,
    },
    y: {
      from: 0,
      to: 700,
    },
    w: 0,
    h: 0,
    pt: 50,
    pl: 10,
    radius: 0,
    bgColor: "rgba(0, 0, 0, 0)",
  }
  container.w = container.x.to - container.x.from
  container.h = container.y.to - container.y.from
  const canvas = createCanvas(container.w, container.h)
  const ctx = canvas.getContext("2d")
  drawRectangle(ctx, container, container.bgColor)

  const ascColor = "#56c9ac"
  const descColor = "#ed5565"
  const itemContainer: RectangleStats = {
    x: {
      from: 0,
      to: 0,
    },
    y: {
      from: 0,
      to: 160,
    },
    mt: 10,
    w: 0,
    h: 160,
    pt: 20,
    pl: 15,
    radius: 7,
    bgColor: "#202020",
  }
  for (const [idx, item] of Object.entries(data)) {
    const leftCol = +idx % 2 === 0
    itemContainer.x = {
      from: leftCol ? 0 : 455,
      to: leftCol ? 445 : 900,
    }
    drawRectangle(ctx, itemContainer, itemContainer.bgColor)
    const {
      symbol,
      current_price,
      sparkline_in_7d,
      price_change_percentage_24h,
      price_change_percentage_7d_in_currency,
    } = item
    // image
    const image = await loadImage(item.image)
    const radius = 20
    const imageX = itemContainer.x.from + (itemContainer.pl ?? 0)
    const imageY = itemContainer.y.from + (itemContainer.pt ?? 0)
    ctx.drawImage(image, imageX, imageY, radius * 2, radius * 2)

    // symbol
    ctx.font = "bold 29px Inter"
    ctx.fillStyle = "white"
    const symbolText = symbol.toUpperCase()
    const symbolH = heightOf(ctx, symbolText)
    const symbolX = imageX + radius * 2 + 10
    const symbolY = imageY + radius + symbolH / 2
    ctx.fillText(symbolText, symbolX, symbolY)

    // 7d chart
    const { price } = sparkline_in_7d
    const labels = price.map((p: number) => `${p}`)
    const buffer = await renderChartImage({
      labels,
      data: price,
      lineOnly: true,
      colorConfig: {
        borderColor:
          price_change_percentage_7d_in_currency >= 0 ? ascColor : descColor,
        backgroundColor: "#fff",
      },
    })
    const chart = await loadImage(buffer)
    const chartW = 200
    const chartH = 50
    const chartX = itemContainer.x.to - chartW - 15
    const chartY = itemContainer.y.from + (itemContainer.pt ?? 0)
    ctx.drawImage(chart, chartX, chartY, chartW, chartH)

    // price
    ctx.font = "bold 30px Inter"
    ctx.fillStyle = "white"
    const currentPrice = `$${current_price.toLocaleString()}`
    const priceW = widthOf(ctx, currentPrice)
    const priceH = heightOf(ctx, currentPrice)
    const priceX = itemContainer.x.to - priceW - 15
    const priceY = chartY + chartH + 10 + priceH
    ctx.fillText(currentPrice, priceX, priceY)

    // 24h change
    ctx.font = "26px Inter"
    ctx.fillStyle = price_change_percentage_24h >= 0 ? ascColor : descColor
    const change = `${
      price_change_percentage_24h >= 0 ? "+" : ""
    }${price_change_percentage_24h.toFixed(2)}%`
    const changeW = widthOf(ctx, change)
    const changeH = heightOf(ctx, change)
    const changeX = itemContainer.x.to - changeW - 15
    const changeY = priceY + changeH + 10
    ctx.fillText(change, changeX, changeY)

    // next row
    if (!leftCol) {
      itemContainer.y.from += itemContainer.h + (itemContainer.mt ?? 0)
      itemContainer.y.to = itemContainer.y.from + itemContainer.h
    }
  }

  return new MessageAttachment(canvas.toBuffer(), "watchlist.png")
}

const command: SlashCommand = {
  name: "view",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("view")
      .setDescription("View your watchlist")
      .addNumberOption((option) =>
        option
          .setName("page")
          .setDescription(
            "Index of watchlist page you wanna see. Start from 1."
          )
          .setRequired(false)
      )
  },
  run: async function (interaction: CommandInteraction) {
    let page = interaction.options.getNumber("page") ?? 0
    page = Math.max(isNaN(page) ? 0 : page - 1, 0)
    const userId = interaction.user.id
    const { data, pagination, ok } = await CacheManager.get({
      pool: "watchlist",
      key: `watchlist-${userId}-${page}`,
      call: () => defi.getUserWatchlist({ userId, page, size: 8 }),
    })
    if (!ok) return { messageOptions: { embeds: [getErrorEmbed({})] } }
    const embed = composeEmbedMessage2(interaction, {
      author: [
        `${interaction.user.username}'s watchlist`,
        interaction.user.displayAvatarURL({ format: "png" }),
      ],
      footer: pagination ? getPaginationFooter(pagination) : undefined,
    })
    if (!data?.length) {
      embed.setDescription(
        `No items in your watchlist.\n Please use \`${PREFIX}watchlist add\` to add one.`
      )
      return { messageOptions: { embeds: [embed] } }
    }
    embed.setImage("attachment://watchlist.png")
    return {
      messageOptions: {
        embeds: [embed],
        files: [await renderWatchlist(<any[]>data)],
      },
    }
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        thumbnail: thumbnails.TOKENS,
        title: "Show list of your favorite tokens",
        description: `Data is fetched from [CoinGecko](https://coingecko.com/)`,
        usage: `${PREFIX}watchlist view`,
        examples: `${PREFIX}watchlist view`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
