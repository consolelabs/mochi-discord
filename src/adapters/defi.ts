import { Message } from "discord.js"
import { DiscordWalletTransferError } from "errors/DiscordWalletTransferError"
import fetch from "node-fetch"
import {
  DiscordWalletTransferRequest,
  Token,
  DiscordWalletBalances,
} from "types/defi"
import dayjs from "dayjs"
import { BotBaseError, InvalidInputError } from "errors"
import { composeEmbedMessage } from "utils/discordEmbed"
import { defaultEmojis, getEmoji, roundFloatNumber } from "utils/common"
import { getCommandObject } from "utils/commands"
import { API_BASE_URL } from "utils/constants"
import Config from "./config"

class Defi {
  async parseRecipients(msg: Message, args: string[], fromDiscordId: string) {
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

    return (
      await Promise.all(
        targets.map(async (target) => {
          const targetId = target
            .replace("<@!", "")
            .replace("<@&", "")
            .replace("<@", "")
            .replace(">", "")
          switch (true) {
            // role
            case target.startsWith("<@&"): {
              const members = (await msg.guild.members.fetch()).filter((mem) =>
                mem.roles.cache.map((role) => role.id).includes(targetId)
              )
              return members.map((member) => member.user.id)
            }

            // user
            case target.startsWith("<@!") || target.startsWith("<@"):
              return [targetId]

            // special role
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
  }

  public async discordWalletTransfer(body: string, msg: Message) {
    const resp = await fetch(`${API_BASE_URL}/defi/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })

    const { errors, data } = await resp.json()
    this.handleTransferError(msg, errors)

    return data
  }

  handleTransferError(msg: Message, errors: string[]) {
    if (!errors || !errors.length) {
      return
    }
    let errorMsg
    switch (true) {
      case errors[0].includes("balance is not enough"):
        errorMsg = "Your balance is not enough to proceed this transaction"
        break
      case errors[0].includes("insufficient funds for gas"):
        errorMsg = "Insufficient funds for gas"
        break
      default:
        errorMsg = null
        break
    }
    throw new DiscordWalletTransferError({
      discordId: msg.author.id,
      guildId: msg.guildId,
      message: msg,
      errorMsg,
    })
  }

  public async getSupportedTokens(): Promise<Token[]> {
    const resp = await fetch(`${API_BASE_URL}/defi/tokens`, {
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

  public async discordWalletWithdraw(body: string) {
    const resp = await fetch(`${API_BASE_URL}/defi/withdraw`, {
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
    guildId: string,
    discordId: string
  ): Promise<DiscordWalletBalances> {
    const resp = await fetch(
      `${API_BASE_URL}/defi/balances?guild_id=${guildId}&discord_id=${discordId}`,
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

  public async getCoin(message: Message, id: string) {
    const resp = await fetch(`${API_BASE_URL}/defi/coins/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (resp.status !== 200) {
      throw new InvalidInputError({ message })
    }

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async searchCoins(message: Message, query: string) {
    const resp = await fetch(`${API_BASE_URL}/defi/coins?query=${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (resp.status !== 200) {
      throw new InvalidInputError({ message })
    }

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new BotBaseError(json.error)
    }

    return json.data
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
      `${API_BASE_URL}/defi/market-chart?coin_id=${id}&currency=${currency}&days=${days}`,
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

  public getDateStr(timestamp: number) {
    return dayjs(timestamp).format("MMMM DD, YYYY")
  }

  /**
   * Returns number of seconds convert from a timestring
   *
   * e.g. convertToSeconds("5m") = 300s
   */
  convertToSeconds(timeStr: string): number {
    switch (true) {
      case timeStr.endsWith("s"):
        return +timeStr.substring(0, timeStr.length - 1)
      case timeStr.endsWith("m"):
        return +timeStr.substring(0, timeStr.length - 1) * 60
      case timeStr.endsWith("h"):
        return +timeStr.substring(0, timeStr.length - 1) * 3600
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

  public async getTransferPayload(
    msg: Message,
    args: string[]
  ): Promise<DiscordWalletTransferRequest> {
    const commandObject = getCommandObject(msg)
    const type = commandObject.command
    const sender = msg.author.id
    let amountArg: string,
      cryptocurrency: string,
      recipients: string[] = [],
      each = false

    switch (type) {
      case "tip": {
        each = args[args.length - 1].toLowerCase() === "each"
        args = each ? args.slice(0, args.length - 1) : args
        recipients = await this.parseRecipients(msg, args, sender)
        cryptocurrency = args[args.length - 1].toUpperCase()
        amountArg = args[args.length - 2].toLowerCase()
        each = each && amountArg !== "all"
        break
      }

      case "airdrop": {
        amountArg = args[1]
        cryptocurrency = args[2].toUpperCase()
        break
      }

      case "withdraw": {
        const toAddress = args[3]
        if (!toAddress.startsWith("0x")) {
          throw new Error("Invalid destination address")
        }
        recipients = [toAddress]
        amountArg = args[1].toLowerCase()
        cryptocurrency = args[2].toUpperCase()
        break
      }
    }

    if ((!recipients || !recipients.length) && type !== "airdrop") {
      throw new DiscordWalletTransferError({
        discordId: sender,
        guildId: msg.guildId,
        message: msg,
        errorMsg: "No valid recipient found!",
      })
    }

    if (type !== "withdraw")
      for (const recipientId of recipients) {
        const user = await msg.guild.members.fetch(recipientId)
        if (!user) {
          throw new DiscordWalletTransferError({
            discordId: sender,
            guildId: msg.guildId,
            message: msg,
            errorMsg: `User <@!${recipientId}> not found`,
          })
        }
      }

    const amount = parseFloat(amountArg)
    if ((isNaN(amount) || amount <= 0) && amountArg !== "all") {
      throw new DiscordWalletTransferError({
        discordId: sender,
        guildId: msg.guildId,
        message: msg,
        errorMsg: "Invalid amount",
      })
    }

    const gTokens = (await Config.getGuildTokens(msg.guildId)) ?? []
    const supportedSymbols = gTokens.map((token) => token.symbol.toUpperCase())
    if (!supportedSymbols.includes(cryptocurrency)) {
      throw new DiscordWalletTransferError({
        discordId: sender,
        guildId: msg.guildId,
        message: msg,
        errorMsg: "Unsupported token",
      })
    }

    return {
      sender,
      recipients,
      amount,
      cryptocurrency,
      guildId: msg.guildId,
      channelId: msg.channelId,
      opts:
        type === "airdrop"
          ? this.getAirdropOptions(args, sender, msg)
          : undefined,
      all: amountArg === "all",
      token: gTokens[supportedSymbols.indexOf(cryptocurrency)],
      transferType: type,
    }
  }
}

export default new Defi()
