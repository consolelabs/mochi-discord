import { CommandInteraction, GuildMember, Message } from "discord.js"
import { DiscordWalletTransferError } from "errors/DiscordWalletTransferError"
import fetch from "node-fetch"
import {
  OffchainTipBotTransferRequest,
  OffchainTipBotWithdrawRequest,
  Token,
  Coin,
  CoinComparisionData,
  GasPriceData,
} from "types/defi"
import { composeEmbedMessage } from "utils/discordEmbed"
import { defaultEmojis, getEmoji, roundFloatNumber } from "utils/common"
import { getCommandObject, parseDiscordToken } from "utils/commands"
import {
  API_BASE_URL,
  BSCSCAN_API,
  ETHSCAN_API,
  FTMSCAN_API,
  POLYGONSCAN_API,
} from "utils/constants"
import { Fetcher } from "./fetcher"
import {
  ResponseGetNftWatchlistResponse,
  ResponseNftWatchlistSuggestResponse,
  RequestCreateAssignContract,
  RequestOffchainTransferRequest,
  RequestOffchainWithdrawRequest,
} from "types/api"
import { commands } from "commands"
import parse from "parse-duration"

class Defi extends Fetcher {
  protected hasRole(roleId: string) {
    return (m: GuildMember) => m.roles.cache.some((r) => r.id === roleId)
  }

  protected isStatus(shouldBeOnline: boolean) {
    return (m: GuildMember) =>
      shouldBeOnline
        ? m.presence?.status !== "offline" &&
          m.presence?.status !== "invisible" &&
          Boolean(m.presence?.status)
        : true // if not specify online then default to get all
  }

  protected isNotBot(m: GuildMember) {
    return !m.user.bot
  }

  async parseRecipients(
    msg: Message | CommandInteraction,
    targets: string[],
    fromDiscordId: string
  ) {
    const isOnline = targets.includes("online")
    return Array.from(
      new Set(
        (
          await Promise.all(
            targets.map(async (target) => {
              const {
                isUser,
                isRole,
                isChannel,
                value: targetId,
              } = parseDiscordToken(target)
              switch (true) {
                // role
                case isRole: {
                  if (!msg.guild?.members) return []
                  const members = (await msg.guild.members.fetch())
                    .filter(this.isNotBot)
                    .filter(this.hasRole(targetId))
                    .filter(this.isStatus(isOnline))
                  return members.map((member) => member.user.id)
                }

                // user
                case isUser: {
                  const member = await msg.guild?.members.fetch(targetId)
                  if (!member || !this.isNotBot(member)) return []
                  return [targetId]
                }

                case isChannel: {
                  if (!msg.guild?.members) return []
                  // fetch guild members otherwise the list will not be full (cached)
                  await msg.guild.members.fetch()
                  const channel = await msg.guild.channels.fetch(targetId)
                  if (!channel) return []
                  if (channel.isText() && !channel.isThread()) {
                    return Array.from(
                      channel.members
                        .filter(this.isNotBot)
                        .filter(this.isStatus(isOnline))
                        .keys()
                    )
                  }
                  return []
                }

                case target.toLowerCase() === "online" &&
                  targets.every(
                    (t) =>
                      !parseDiscordToken(t).isChannel &&
                      !parseDiscordToken(t).isRole
                  ): {
                  if (!msg.guild?.members) return []
                  const members = (await msg.guild.members.fetch())
                    .filter((m) => !m.user.bot)
                    .filter(
                      (mem) =>
                        Boolean(mem.presence?.status) &&
                        mem.presence?.status !== "offline" &&
                        mem.presence?.status !== "invisible"
                    )
                  return members.map((member) => member.user.id)
                }

                // special role
                case ["@everyone", "@here"].includes(target): {
                  if (!msg.guild?.members) return []
                  const members = (await msg.guild.members.fetch())
                    .filter(this.isNotBot)
                    .filter(this.isStatus(isOnline))
                    .filter(
                      (mem) =>
                        mem.roles.cache
                          .map((role) => role.name)
                          .includes("@everyone") ||
                        mem.roles.cache
                          .map((role) => role.name)
                          .includes("@here")
                    )
                  return members.map((member) => member.user.id)
                }
              }
              return []
            })
          )
        )
          .flat()
          .filter(
            (toDiscordId) => toDiscordId !== "" && toDiscordId !== fromDiscordId
          )
      )
    )
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

  public async getCoin(id: string) {
    return await this.jsonFetch<Coin>(`${API_BASE_URL}/defi/coins/${id}`)
  }

  public async searchCoins(query: string) {
    return await this.jsonFetch(`${API_BASE_URL}/defi/coins?query=${query}`)
  }

  async getHistoricalMarketData({
    coinId,
    currency,
    days = 7,
    discordId,
  }: {
    coinId: string
    currency: string
    days?: number
    discordId?: string
  }) {
    return await this.jsonFetch<{
      times: string[]
      prices: number[]
      from: string
      to: string
    }>(`${API_BASE_URL}/defi/market-chart`, {
      query: {
        coin_id: coinId,
        currency,
        days,
        ...(discordId && { discordId }),
      },
    })
  }

  async compareToken(
    guildId: string,
    baseQ: string,
    targetQ: string,
    days: number
  ) {
    return await this.jsonFetch<CoinComparisionData>(
      `${API_BASE_URL}/defi/coins/compare?base=${baseQ}&target=${targetQ}&guild_id=${guildId}&interval=${days}`
    )
  }

  getAirdropOptions(args: string[], discordId: string, msg: Message) {
    const options: { duration: number; maxEntries: number } = {
      duration: 180, // in secs
      maxEntries: 0,
    }

    if (![3, 5, 7].includes(args.length)) {
      throw new DiscordWalletTransferError({
        discordId,
        message: msg,
        error: "Invalid airdrop command",
      })
    }

    const durationReg = /in\s+\d+[hms]/
    const durationIdx = msg.content.search(durationReg)
    if (durationIdx !== -1) {
      const timeStr = msg.content
        .substring(durationIdx)
        .replace(/in\s+/, "")
        .split(" ")[0]
      options.duration = parse(timeStr) / 1000
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
        `${tokenEmoji} ${roundFloatNumber(required, 4)} ${symbol}`,
        true
      )
      .addField(
        "Your balance",
        `${tokenEmoji} ${roundFloatNumber(current, 4)} ${symbol}`,
        true
      )
  }

  public parseTipParameters(args: string[]) {
    const each = args[args.length - 1].toLowerCase() === "each"
    args = each ? args.slice(0, args.length - 1) : args
    const cryptocurrency = args[args.length - 1].toUpperCase()
    const amountArg = args[args.length - 2].toLowerCase()
    return { each, cryptocurrency, amountArg }
  }

  public classifyTipSyntaxTargets(msgContent: string): {
    targets: Array<string>
    isValid: boolean
  } {
    const components = msgContent.split(" ")
    const result: {
      targets: Array<string>
      isValid: boolean
    } = {
      targets: [],
      isValid: false,
    }

    result.targets = components.reduce<Array<string>>((targets, c) => {
      const { isRole, isChannel, isUser, isUnknown } = parseDiscordToken(c)

      if (isUnknown) {
        if (["online", "@everyone", "@here"].includes(c.toLowerCase())) {
          return [...targets, c.toLowerCase()]
        }
      }

      if (isRole || isChannel || isUser) {
        return [...targets, c]
      }

      return targets
    }, [])

    // all syntax are correct
    if (result.targets.length === components.length) result.isValid = true

    return result
  }

  public async getTipPayload(
    msg: Message | CommandInteraction,
    args: string[],
    authorId: string,
    targets: string[]
  ): Promise<OffchainTipBotTransferRequest> {
    const type = args[0]
    const sender = authorId
    let recipients: string[] = []

    const guildId = msg.guildId ?? "DM"

    // parse recipients
    const {
      each: eachParse,
      cryptocurrency,
      amountArg,
    } = this.parseTipParameters(args)
    recipients = await this.parseRecipients(msg, targets, sender)

    // check if recipient is valid or not
    if (!recipients || !recipients.length) {
      throw new DiscordWalletTransferError({
        discordId: sender,
        message: msg,
        error: "No valid recipient found!",
      })
    }

    // check recipients exist in discord server or not
    for (const recipientId of recipients) {
      const user = await msg.guild?.members.fetch(recipientId)
      if (!user) {
        throw new DiscordWalletTransferError({
          discordId: sender,
          message: msg,
          error: `User <@!${recipientId}> not found`,
        })
      }
    }

    // validate tip amount, just allow: number (1, 2, 3.4, 5.6) or string("all")
    let amount = parseFloat(amountArg)
    if ((isNaN(amount) || amount <= 0) && amountArg !== "all") {
      throw new DiscordWalletTransferError({
        discordId: sender,
        message: msg,
        error: "Invalid amount",
      })
    }
    const each = eachParse && amountArg !== "all"
    amount = each ? amount * recipients.length : amount

    return {
      sender,
      recipients,
      guildId,
      channelId: msg.channelId,
      amount,
      token: cryptocurrency,
      each,
      all: amountArg === "all",
      transferType: type ?? "",
      duration: 0,
      fullCommand: "",
    }
  }

  public async getWithdrawPayload(
    msg: Message,
    args: string[]
  ): Promise<OffchainTipBotWithdrawRequest> {
    const commandObject = getCommandObject(commands, msg)
    const type = commandObject?.command
    const sender = msg.author.id
    const guildId = msg.guildId ?? "DM"

    const toAddress = args[3]
    if (!toAddress.startsWith("0x")) {
      throw new Error("Invalid destination address")
    }
    const recipients = [toAddress]
    const amountArg = args[1].toLowerCase()
    const cryptocurrency = args[2].toUpperCase()

    // check if recipient is valid or not
    if (!recipients || !recipients.length) {
      throw new DiscordWalletTransferError({
        discordId: sender,
        message: msg,
        error: "No valid recipient found!",
      })
    }

    // validate tip amount, just allow: number (1, 2, 3.4, 5.6) or string("all")
    const amount = parseFloat(amountArg)
    if ((isNaN(amount) || amount <= 0) && amountArg !== "all") {
      throw new DiscordWalletTransferError({
        discordId: sender,
        message: msg,
        error: "Invalid amount",
      })
    }

    // // check if tip token is in guild config
    // const gTokens = (await Config.getGuildTokens(msg.guildId ?? "")) ?? []
    // const supportedSymbols = gTokens.map((token) => token.symbol.toUpperCase())
    // if (cryptocurrency != "" && !supportedSymbols.includes(cryptocurrency)) {
    //   throw new DiscordWalletTransferError({
    //     discordId: sender,
    //     guildId,
    //     message: msg,
    //     errorMsg: "Unsupported token. Please choose another one.",
    //   })
    // }

    return {
      recipient: msg.author.id,
      recipientAddress: toAddress,
      guildId,
      channelId: msg.channelId,
      amount,
      token: cryptocurrency,
      each: false,
      all: amountArg === "all",
      transferType: type ?? "",
      duration: 0,
      fullCommand: "",
    }
  }

  public async getAirdropPayload(
    msg: Message,
    args: string[]
  ): Promise<OffchainTipBotTransferRequest> {
    const commandObject = getCommandObject(commands, msg)
    const type = commandObject?.command
    const sender = msg.author.id
    const recipients: string[] = []
    const amountArg = args[1]
    const cryptocurrency = args[2].toUpperCase()
    const guildId = msg.guildId ?? "DM"

    // validate airdrop amount
    const amount = parseFloat(amountArg)
    if (isNaN(amount) || amount <= 0) {
      throw new DiscordWalletTransferError({
        discordId: sender,
        message: msg,
        error: "Invalid amount",
      })
    }

    // check if tip token is in guild config
    // const gTokens = (await Config.getGuildTokens(msg.guildId ?? "")) ?? []
    // const supportedSymbols = gTokens.map((token) => token.symbol.toUpperCase())
    // if (cryptocurrency != "" && !supportedSymbols.includes(cryptocurrency)) {
    //   throw new DiscordWalletTransferError({
    //     discordId: sender,
    //     guildId,
    //     message: msg,
    //     errorMsg: "Unsupported token. Please choose another one.",
    //   })
    // }
    const options = this.getAirdropOptions(args, sender, msg)

    return {
      sender,
      recipients,
      guildId,
      channelId: msg.channelId,
      amount,
      all: amountArg === "all",
      each: false,
      fullCommand: "",
      duration: options.duration,
      token: cryptocurrency,
      transferType: type ?? "",
      opts: options,
    }
  }

  async getUserWatchlist({
    userId,
    page = 0,
    size = 5,
  }: {
    userId: string
    page?: number
    size?: number
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/defi/watchlist`, {
      query: {
        userId,
        page,
        size,
      },
    })
  }

  async addToWatchlist(req: {
    user_id: string
    symbol: string
    coin_gecko_id?: string
    is_fiat: boolean
  }) {
    return await this.jsonFetch<{ suggestion: Coin[] }>(
      `${API_BASE_URL}/defi/watchlist`,
      {
        method: "POST",
        body: JSON.stringify(req),
      }
    )
  }

  async removeFromWatchlist(query: { userId: string; symbol: string }) {
    return await this.jsonFetch<{ suggestion: Coin[] }>(
      `${API_BASE_URL}/defi/watchlist`,
      {
        method: "DELETE",
        query,
      }
    )
  }

  async getGasPrice(chain: string) {
    const gasTrackerUrls: Record<string, string> = {
      ftm: FTMSCAN_API,
      bsc: BSCSCAN_API,
      matic: POLYGONSCAN_API,
      eth: ETHSCAN_API,
    }
    const url = gasTrackerUrls[chain]
    const query = {
      module: "gastracker",
      action: "gasoracle",
    }
    return await this.jsonFetch<{ result: GasPriceData }>(url, {
      query,
      silent: true,
    })
  }

  async getUserNFTWatchlist({
    userId,
    page = 0,
    size = 5,
  }: {
    userId: string
    page?: number
    size?: number
  }) {
    return await this.jsonFetch<ResponseGetNftWatchlistResponse>(
      `${API_BASE_URL}/nfts/watchlist`,
      {
        query: {
          userId,
          page,
          size,
        },
      }
    )
  }

  async addNFTToWatchlist(req: {
    user_id: string
    collection_symbol: string
    collection_address?: string
    chain?: string
  }) {
    return await this.jsonFetch<ResponseNftWatchlistSuggestResponse>(
      `${API_BASE_URL}/nfts/watchlist`,
      {
        method: "POST",
        body: req,
      }
    )
  }

  async removeNFTFromWatchlist(query: { userId: string; symbol: string }) {
    return await this.jsonFetch(`${API_BASE_URL}/nfts/watchlist`, {
      method: "DELETE",
      query,
    })
  }

  async offchainTipBotAssignContract(req: RequestCreateAssignContract) {
    return await this.jsonFetch(
      `${API_BASE_URL}/offchain-tip-bot/assign-contract`,
      {
        method: "POST",
        body: req,
      }
    )
  }

  async offchainGetUserBalances(query: { userId: string }) {
    return await this.jsonFetch(`${API_BASE_URL}/offchain-tip-bot/balances`, {
      method: "GET",
      query,
    })
  }

  async offchainDiscordTransfer(req: RequestOffchainTransferRequest) {
    return await this.jsonFetch(`${API_BASE_URL}/offchain-tip-bot/transfer`, {
      method: "POST",
      body: req,
    })
  }

  async offchainDiscordWithdraw(req: RequestOffchainWithdrawRequest) {
    return await this.jsonFetch(`${API_BASE_URL}/offchain-tip-bot/withdraw`, {
      method: "POST",
      body: req,
    })
  }

  async getFiatHistoricalData(query: {
    base: string
    target: string
    days?: string
  }) {
    query.days = query.days ?? "7"
    return await this.jsonFetch(
      `${API_BASE_URL}/fiat/historical-exchange-rates`,
      {
        query,
      }
    )
  }
}

export default new Defi()
