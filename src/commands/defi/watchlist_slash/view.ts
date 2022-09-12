import { SlashCommand } from "types/common"
import { CommandInteraction, MessageAttachment } from "discord.js"
import { getPaginationFooter, thumbnails } from "utils/common"
import { getErrorEmbed, composeEmbedMessage2 } from "utils/discordEmbed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import defi from "adapters/defi"
import { createCanvas, loadImage } from "canvas"
import { RectangleStats } from "types/canvas"
import {
  drawDivider,
  drawRectangle,
  heightOf,
  renderChartImage,
  widthOf,
} from "utils/canvas"

async function renderWatchlist(data: any[]) {
  const container: RectangleStats = {
    x: {
      from: 0,
      to: 850,
    },
    y: {
      from: 0,
      to: 500,
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
  ctx.save()
  drawRectangle(ctx, container, container.bgColor)
  ctx.clip()

  const itemX = 50
  let itemY = 30
  const radius = 30
  const ascColor = "#56c9ac"
  const descColor = "#ed5565"
  // header
  ctx.font = "bold 33px Manrope"
  ctx.fillStyle = "white"
  ctx.fillText("Tokens", itemX - radius, itemY)
  ctx.fillText("Last 7 days", 330, itemY)
  const col3Header = "Price / 24h"
  const col3HeaderW = widthOf(ctx, col3Header)
  ctx.fillText(
    col3Header,
    container.x.to - (container.pl ?? 0) - col3HeaderW,
    itemY
  )
  itemY += 35
  for (const item of data) {
    const {
      // name,
      symbol,
      current_price,
      sparkline_in_7d,
      price_change_percentage_24h,
      price_change_percentage_7d_in_currency,
    } = item

    // image
    const image = await loadImage(item.image)
    ctx.drawImage(image, itemX - radius, itemY, radius * 2, radius * 2)

    // col2 symbol
    ctx.font = "bold 31px Manrope"
    ctx.fillStyle = "white"
    const symbolText = symbol.toUpperCase()
    const symbolH = heightOf(ctx, symbolText)
    const col2X = itemX + radius + 20
    const col2Y = itemY + radius + symbolH / 2
    ctx.fillText(symbolText, col2X, col2Y)

    // col3 = 7d chart
    const col3X = col2X + 160
    const col3Y = itemY + radius
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
    ctx.drawImage(chart, col3X, col3Y - radius, 320, radius * 2)

    // col4 = price + change
    const col4X = container.x.to - (container.pl ?? 0)

    // price
    ctx.font = "bold 30px Manrope"
    ctx.fillStyle = "white"
    const currentPrice = `$${current_price.toLocaleString()}`
    // const priceH = heightOf(ctx, currentPrice)
    const priceW = widthOf(ctx, currentPrice)
    ctx.fillText(currentPrice, col4X - priceW, itemY + radius - 7)

    // 24h change
    ctx.font = "26px Manrope"
    ctx.fillStyle = price_change_percentage_24h >= 0 ? ascColor : descColor
    const change = `${
      price_change_percentage_24h >= 0 ? "+" : ""
    }${price_change_percentage_24h.toFixed(2)}%`
    const changeW = widthOf(ctx, change)
    const changeH = heightOf(ctx, change)
    ctx.fillText(change, col4X - changeW, itemY + radius + changeH + 7)

    // divider
    drawDivider(
      ctx,
      container.x.from + (container.pl ?? 0),
      container.x.to - (container.pl ?? 0),
      itemY - 15,
      "#918d8d"
    )

    // next row
    itemY += 90
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
    const { data, pagination, ok } = await defi.getUserWatchlist({
      userId: interaction.user.id,
      page,
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
