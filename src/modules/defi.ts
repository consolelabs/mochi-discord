import { Message, MessageAttachment } from "discord.js"
import { API_SERVER_HOST } from "env"
import { DiscordWalletTransferError } from "errors/DiscordWalletTransferError"
import { InsufficientBalanceError } from "errors/InsufficientBalanceError"
import fetch from "node-fetch"
import {
  DiscordWalletTransferRequest,
  Token,
  DiscordWalletWithdrawRequest,
  DiscordWalletBalances,
} from "types/defi"
import { ChartJSNodeCanvas } from "chartjs-node-canvas"
import dayjs from "dayjs"
import * as Canvas from "canvas"
import { InvalidInputError } from "errors"
import { composeEmbedMessage } from "utils/discord-embed"
import { defaultEmojis, getEmoji, roundFloatNumber } from "utils/common"

class Defi {
  async getTargetDiscordIds(
    msg: Message,
    args: string[],
    fromDiscordId: string
  ) {
    let targets = args
      .slice(1, args.length - 2)
      .join("")
      .split(",")
      .map((id) => id.trim())
    targets = [...new Set(targets)]

    targets.forEach((u) => {
      if (u !== "@everyone" && !u.startsWith("<@")) {
        throw new Error("Invalid user")
      }
    })

    const toDiscordIds: any[] = (
      await Promise.all(
        targets.map(async (target) => {
          const targetId = target
            .replace("<@!", "")
            .replace("<@&", "")
            .replace("<@", "")
            .replace(">", "")
          switch (true) {
            case target.startsWith("<@&"): {
              const members = (await msg.guild.members.fetch()).filter((mem) =>
                mem.roles.cache.map((role) => role.id).includes(targetId)
              )
              return members.map((member) => member.user.id)
            }

            case target.startsWith("<@!") || target.startsWith("<@"):
              return [targetId]

            case target === "@everyone": {
              const members = (await msg.guild.members.fetch()).filter((mem) =>
                mem.roles.cache.map((role) => role.name).includes("@everyone")
              )
              return members.map((member) => member.user.id)
            }
          }
        })
      )
    )
      .flat()
      .filter(
        (toDiscordId) => toDiscordId !== "" && toDiscordId !== fromDiscordId
      )

    return toDiscordIds
  }

  public async getTransferRequestPayload(
    msg: Message,
    args: string[]
  ): Promise<DiscordWalletTransferRequest> {
    const each = args[args.length - 1].toLowerCase() === "each"
    args = each ? args.slice(0, args.length - 1) : args
    const fromDiscordId = msg.author.id
    const toDiscordIds = await this.getTargetDiscordIds(
      msg,
      args,
      fromDiscordId
    )

    if (!toDiscordIds || toDiscordIds.length === 0) {
      throw new DiscordWalletTransferError({
        discordId: fromDiscordId,
        guildId: msg.guildId,
        message: msg,
        errorMsg: "No valid recipient found!",
      })
    }

    for (const toDiscordId of toDiscordIds) {
      const user = await msg.guild.members.fetch(toDiscordId)
      if (!user) {
        throw new DiscordWalletTransferError({
          discordId: fromDiscordId,
          guildId: msg.guildId,
          message: msg,
          errorMsg: `User <@!${toDiscordId}> not found`,
        })
      }
    }

    const amountArg = args[args.length - 2].toLowerCase()
    const amount = parseFloat(amountArg)
    if ((isNaN(amount) || amount <= 0) && amountArg !== "all") {
      throw new DiscordWalletTransferError({
        discordId: fromDiscordId,
        guildId: msg.guildId,
        message: msg,
        errorMsg: "Invalid amount",
      })
    }

    const cryptocurrency = args[args.length - 1].toUpperCase()
    const supportedTokens = (await this.getSupportedTokens()).map((token) =>
      token.symbol.toUpperCase()
    )
    if (!supportedTokens.includes(cryptocurrency)) {
      throw new DiscordWalletTransferError({
        discordId: fromDiscordId,
        guildId: msg.guildId,
        message: msg,
        errorMsg: "Unsupported token",
      })
    }

    return {
      fromDiscordId,
      toDiscordIds,
      amount,
      cryptocurrency,
      guildId: msg.guildId,
      channelId: msg.channelId,
      each,
      all: amountArg === "all",
    }
  }

  public async discordWalletTransfer(body: string, msg: Message) {
    const resp = await fetch(`${API_SERVER_HOST}/api/v1/defi/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })

    const { errors, data } = await resp.json()
    if (errors && errors.length && data == undefined) {
      if (errors[0].includes("balance")) {
        throw new InsufficientBalanceError({
          discordId: msg.author.id,
          guildId: msg.guildId,
          message: msg,
        })
      }
      throw new DiscordWalletTransferError({
        discordId: msg.author.id,
        guildId: msg.guildId,
        message: msg,
      })
    }
    return data
  }

  public async getSupportedTokens(): Promise<Token[]> {
    const resp = await fetch(`${API_SERVER_HOST}/api/v1/defi/tokens`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (resp.status !== 200) {
      throw new Error("Error while fetching supported tokens data")
    }

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async getWithdrawPayload(
    msg: Message,
    args: string[]
  ): Promise<DiscordWalletWithdrawRequest> {
    const toAddress = args[1]
    if (!toAddress.startsWith("0x")) {
      throw new Error("Invalid destination address")
    }

    const amountArg = args[2].toLowerCase()
    const amount = parseFloat(amountArg)
    if ((isNaN(amount) || amount <= 0) && amountArg !== "all") {
      throw new Error("Invalid amount")
    }

    const cryptocurrency = args[3].toUpperCase()
    const supportedTokens = (await this.getSupportedTokens()).map((token) =>
      token.symbol.toUpperCase()
    )
    if (!supportedTokens.includes(cryptocurrency)) {
      throw new Error("Unsupported token")
    }
    return {
      fromDiscordId: msg.author.id,
      toAddress,
      amount,
      cryptocurrency,
      guildId: msg.guildId,
      channelId: msg.channelId,
      all: amountArg === "all",
    }
  }

  public async discordWalletWithdraw(body: string) {
    const resp = await fetch(`${API_SERVER_HOST}/api/v1/defi/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async discordWalletBalances(
    discordId: string
  ): Promise<DiscordWalletBalances> {
    const resp = await fetch(
      `${API_SERVER_HOST}/api/v1/defi/balances?discord_id=${discordId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    )
    if (resp.status !== 200) {
      throw new Error(
        "Error while fetching user balances: " + (await resp.json()).error
      )
    }

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async getCoinCurrentData(message: Message, id: string): Promise<any> {
    const resp = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (resp.status !== 200) {
      if (resp.status === 404) {
        // try to search by symbol
        const coins = await this.searchForCoins(id)
        if (coins && coins.length)
          return await this.getCoinCurrentData(message, coins[0].id)
      }
      throw new InvalidInputError({ message })
    }

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  async getHistoricalMarketData(
    message: Message,
    id: string,
    currency: string,
    days: number
  ): Promise<{
    timestamps: string[]
    prices: number[]
    from: string
    to: string
  }> {
    const resp = await fetch(
      `${API_SERVER_HOST}/api/v1/defi/market-chart?coin_id=${id}&currency=${currency}&days=${days}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    )
    if (resp.status !== 200) {
      throw new InvalidInputError({ message })
    }

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  async searchForCoins(query: string) {
    const resp = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${query}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    )
    if (resp.status !== 200) {
      throw new Error(
        "Error while fetching historical market data: " +
          (await resp.json()).error
      )
    }

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.coins.filter(
      (coin: any) => coin.symbol.toLowerCase() === query.toLowerCase()
    )
  }

  public getDateStr(timestamp: number) {
    return dayjs(timestamp).format("MMMM DD, YYYY")
  }

  public getChartColorConfig(id: string, width: number, height: number) {
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

    const canvas = Canvas.createCanvas(width, height)
    const ctx = canvas.getContext("2d")
    const gradient = ctx.createLinearGradient(0, 0, 0, 400)
    gradient.addColorStop(0, gradientFrom)
    gradient.addColorStop(1, gradientTo)
    return {
      borderColor,
      backgroundColor: gradient,
    }
  }

  public async renderHistoricalMarketChart({
    msg,
    id,
    currency,
    days = 7,
  }: {
    msg: Message
    id: string
    currency: string
    days?: number
  }) {
    const { timestamps, prices, from, to } = await this.getHistoricalMarketData(
      msg,
      id,
      currency,
      days
    )
    const width = 970
    const height = 650

    // draw chart
    const chartCanvas = new ChartJSNodeCanvas({ width, height })
    const axisConfig = {
      ticks: {
        font: {
          size: 20,
        },
      },
      grid: {
        borderColor: "black",
      },
    }
    const image = await chartCanvas.renderToBuffer({
      type: "line",
      data: {
        labels: timestamps,
        datasets: [
          {
            label: `Price (${currency.toUpperCase()}), ${from} - ${to}`,
            data: prices,
            borderWidth: 6,
            pointRadius: 0,
            fill: true,
            ...this.getChartColorConfig(id, width, height),
          },
        ],
      },
      options: {
        scales: {
          y: axisConfig,
          x: axisConfig,
        },
        plugins: {
          legend: {
            labels: {
              // This more specific font property overrides the global property
              font: {
                size: 24,
              },
            },
          },
        },
      },
    })

    return new MessageAttachment(image, "chart.png")
  }

  async getCoinPrice(message: Message, idOrSymbol: string): Promise<any> {
    const resp = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${idOrSymbol}&vs_currencies=usd`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    )
    if (resp.status !== 200) {
      throw new InvalidInputError({ message })
    }

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }

    if (resp.status === 200 && Object.keys(json).length === 0) {
      const coins = await this.searchForCoins(idOrSymbol)
      if (coins && coins.length) {
        idOrSymbol = coins[0].id
        return await this.getCoinPrice(message, idOrSymbol)
      }
    }
    return json[idOrSymbol]["usd"]
  }

  convertToSeconds(timeStr: string): number {
    switch (true) {
      case timeStr.endsWith("s"):
        return +timeStr.substr(0, timeStr.length - 1)
      case timeStr.endsWith("m"):
        return +timeStr.substr(0, timeStr.length - 1) * 60
      case timeStr.endsWith("h"):
        return +timeStr.substr(0, timeStr.length - 1) * 3600
    }
  }

  getAirdropOptions(args: string[], discordId: string, msg: Message) {
    const options: { duration: number; maxEntries: number } = {
      duration: 180, // in secs
      maxEntries: 0,
    }

    if (![3, 5, 7].includes(args.length)) {
      throw new DiscordWalletTransferError({
        discordId,
        guildId: msg.guildId,
        message: msg,
        errorMsg: "Invalid airdrop command",
      })
    }

    const durationReg = /in\s+\d+[hms]/
    const durationIdx = msg.content.search(durationReg)
    if (durationIdx !== -1) {
      const timeStr = msg.content
        .substring(durationIdx)
        .replace(/in\s+/, "")
        .split(" ")[0]
      options.duration = this.convertToSeconds(timeStr)
    }

    const maxEntriesReg = /for\s+\d+/
    const maxEntriesIdx = msg.content.search(maxEntriesReg)
    if (maxEntriesIdx !== -1) {
      options.maxEntries = +msg.content
        .substring(maxEntriesIdx)
        .replace(/for\s+/, "")
        .split(" ")[0]
    }
    return options
  }

  public async getAirdropPayload(
    msg: Message,
    args: string[]
  ): Promise<DiscordWalletTransferRequest> {
    const fromDiscordId = msg.author.id

    const amountArg = args[1]
    const amount = parseFloat(amountArg)
    if ((isNaN(amount) || amount <= 0) && amountArg !== "all") {
      throw new DiscordWalletTransferError({
        discordId: fromDiscordId,
        guildId: msg.guildId,
        message: msg,
        errorMsg: "Invalid amount",
      })
    }

    const cryptocurrency = args[2].toUpperCase()
    const supportedTokens = (await this.getSupportedTokens()).map((token) =>
      token.symbol.toUpperCase()
    )
    if (!supportedTokens.includes(cryptocurrency)) {
      throw new DiscordWalletTransferError({
        discordId: fromDiscordId,
        guildId: msg.guildId,
        message: msg,
        errorMsg: "Unsupported token",
      })
    }

    return {
      fromDiscordId,
      toDiscordIds: [],
      amount,
      cryptocurrency,
      guildId: msg.guildId,
      channelId: msg.channelId,
      opts: this.getAirdropOptions(args, fromDiscordId, msg),
      all: amountArg === "all",
    }
  }

  public composeInsufficientBalanceEmbed(
    msg: Message,
    current: number,
    required: number,
    cryptocurrency: string
  ) {
    const tokenEmoji = getEmoji(cryptocurrency)
    const symbol = cryptocurrency.toUpperCase()
    return composeEmbedMessage(msg, {
      title: `${defaultEmojis.ERROR} Insufficient balance`,
      description: `<@${msg.author.id}>, you cannot afford this.`,
    })
      .addField(
        "Required amount",
        `${tokenEmoji}${roundFloatNumber(required, 4)} ${symbol}`,
        true
      )
      .addField(
        "Your balance",
        `${tokenEmoji}${roundFloatNumber(current, 4)} ${symbol}`,
        true
      )
  }
}

export default new Defi()
