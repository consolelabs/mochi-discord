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
import { emojis, getEmoji, getEmojiURL, roundFloatNumber } from "utils/common"
import { getCommandObject, parseDiscordToken } from "utils/commands"
import {
  API_BASE_URL,
  BSCSCAN_API,
  ETHSCAN_API,
  FTMSCAN_API,
  POLYGONSCAN_API,
  SPACES_REGEX,
} from "utils/constants"
import { Fetcher } from "./fetcher"
import {
  ResponseGetNftWatchlistResponse,
  ResponseNftWatchlistSuggestResponse,
  RequestCreateAssignContract,
  RequestOffchainTransferRequest,
  RequestOffchainWithdrawRequest,
  ResponseMonikerConfigData,
  RequestCreateTipConfigNotify,
} from "types/api"
import { commands } from "commands"
import parse from "parse-duration"
import config from "./config"
import { APIError } from "errors"

const TIP_TARGET_TEXT_SELECTOR_MAPPINGS: Array<[string, string]> = [
  //
  ["in my voice channel", "voice"],
  ["in voice channel", "voice"],
  ["voice channel", "voice"],
  ["voice", "voice"],
  //
  ["online", "online"],
  ["@everyone", "all"],
  ["@here", "all"],
]

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

                // voice channel
                case target.toLowerCase() === "voice": {
                  if (!msg.guild?.members || msg instanceof CommandInteraction)
                    return []
                  // fetch guild members otherwise the list will not be full (cached)
                  const members = await msg.guild.members.fetch({ force: true })

                  const voiceChannelId = msg.member?.voice.channelId
                  if (!voiceChannelId) return []

                  const recipients = Array.from(
                    members
                      .filter((m) => m.voice.channelId === voiceChannelId)
                      .mapValues((m) => m.user.id)
                      .values()
                  )
                  return recipients
                }

                // get all
                case target === "all": {
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
    days = 30,
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

  getAirdropOptions(args: string[]) {
    const options: { duration: number; maxEntries: number } = {
      duration: 180, // in secs
      maxEntries: 0,
    }

    const content = args.join(" ").trim()

    const durationReg = /in\s+\d+[hms]/
    const durationIdx = content.search(durationReg)
    if (durationIdx !== -1) {
      const timeStr = content
        .substring(durationIdx)
        .replace(/in\s+/, "")
        .split(" ")[0]
      options.duration = parse(timeStr) / 1000
    }

    const maxEntriesReg = /for\s+\d+/
    const maxEntriesIdx = content.search(maxEntriesReg)
    if (maxEntriesIdx !== -1) {
      options.maxEntries = +content
        .substring(maxEntriesIdx)
        .replace(/for\s+/, "")
        .split(" ")
    }
    return options
  }

  public composeInsufficientBalanceEmbed(
    msgOrInteraction: Message | CommandInteraction,
    current: number,
    required: number,
    cryptocurrency: string
  ) {
    const tokenEmoji = getEmoji(cryptocurrency)
    const symbol = cryptocurrency.toUpperCase()
    const authorId =
      msgOrInteraction instanceof Message
        ? msgOrInteraction.author.id
        : msgOrInteraction.user.id
    return composeEmbedMessage(null, {
      author: ["Insufficient balance", getEmojiURL(emojis.REVOKE)],
      description: `<@${authorId}>, you cannot afford this.\nYou can deposit by \`$deposit ${cryptocurrency}\``,
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
    let content = msgContent
    const targetSet = new Set<string>()
    const result: {
      targets: Array<string>
      isValid: boolean
    } = {
      targets: [],
      isValid: false,
    }
    let selector
    while (
      (selector = TIP_TARGET_TEXT_SELECTOR_MAPPINGS.find((s) =>
        content.toLowerCase().includes(s[0])
      )) !== undefined
    ) {
      const [s, translatedSelector] = selector
      content = content.replace(s, "").replaceAll(/\s{2,}/gim, " ")
      targetSet.add(translatedSelector)
    }
    content = content.trim()

    const components = content.length ? content.split(" ") : []
    const invalidTargets = components.filter((c) => {
      const { isRole, isChannel, isUser } = parseDiscordToken(c)

      if (isRole || isChannel || isUser) {
        targetSet.add(c)
        return false
      }
      return true
    })

    result.targets = Array.from<string>(targetSet)
    // all syntax are correct
    if (invalidTargets.length === 0) result.isValid = true

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

    // check if only tip author
    if (targets.length === 1 && targets[0] === `<@${authorId}>`) {
      throw new DiscordWalletTransferError({
        discordId: sender,
        message: msg,
        error: "Users cannot tip themselves!",
      })
    }
    // check if recipient is valid or not
    if (!recipients || !recipients.length) {
      throw new DiscordWalletTransferError({
        discordId: sender,
        message: msg,
        error: "No valid recipient was found!",
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
    if (
      (isNaN(amount) || amount <= 0) &&
      !["all", "a", "an"].includes(amountArg)
    ) {
      throw new DiscordWalletTransferError({
        discordId: sender,
        message: msg,
        error: "The amount is invalid. Please insert a natural number.",
      })
    }
    if (amountArg === "a" || amountArg === "an") {
      amount = 1
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
    msg: Message | CommandInteraction,
    amountArg: string,
    token: string,
    toAddress: string
  ): Promise<OffchainTipBotWithdrawRequest> {
    let type
    let sender
    if (msg instanceof Message) {
      const commandObject = getCommandObject(commands, msg)
      type = commandObject?.command
      sender = msg.author.id
    } else {
      type = msg.commandName
      sender = msg.user.id
    }
    const guildId = msg.guildId ?? "DM"

    // if (!toAddress.startsWith("0x")) {
    //   throw new Error("Invalid destination address")
    // }
    const recipients = [toAddress]
    const cryptocurrency = token.toUpperCase()

    // check if recipient is valid or not
    if (!recipients || !recipients.length) {
      throw new DiscordWalletTransferError({
        discordId: sender,
        message: msg,
        error: "No valid recipient found!",
      })
    }

    // validate tip amount, just allow: number (1, 2, 3.4, 5.6) or string("all")
    const amount = parseFloat(amountArg.toLowerCase())
    if ((isNaN(amount) || amount <= 0) && amountArg !== "all") {
      throw new DiscordWalletTransferError({
        discordId: sender,
        message: msg,
        error: "The amount is invalid. Please insert a natural number.",
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
      recipient: sender,
      recipientAddress: toAddress,
      guildId,
      channelId: msg.channelId,
      amount,
      token: cryptocurrency,
      each: false,
      all: amountArg === "all",
      transferType: type ?? "",
      duration: 0,
      fullCommand:
        msg instanceof Message
          ? msg.content
          : `${msg.commandName} ${amountArg} ${token} ${toAddress}`,
    }
  }

  public async getAirdropPayload(
    msg: Message | CommandInteraction,
    args: string[]
  ): Promise<OffchainTipBotTransferRequest> {
    let type
    let sender
    if (msg instanceof Message) {
      const commandObject = getCommandObject(commands, msg)
      type = commandObject?.command
      sender = msg.author.id
    } else {
      type = msg.commandName
      sender = msg.user.id
    }
    const guildId = msg.guildId ?? "DM"
    const { newArgs, moniker } = await this.parseMonikerinCmd(args, guildId)
    if (![3, 5, 7].includes(newArgs.length)) {
      throw new DiscordWalletTransferError({
        discordId: sender,
        message: msg,
        error: "Invalid airdrop command",
      })
    }
    // airdrop 1 ftm in 1m for 1
    const amountArg = newArgs[1]
    const recipients: string[] = []
    const cryptocurrency = newArgs[2].toUpperCase()

    // validate airdrop amount
    let amount = parseFloat(amountArg)
    if (
      (isNaN(amount) || amount <= 0) &&
      !["all", "a", "an"].includes(amountArg)
    ) {
      throw new DiscordWalletTransferError({
        discordId: sender,
        message: msg,
        error: "The amount is invalid. Please insert a natural number.",
      })
    }
    if (amountArg === "a" || amountArg === "an") {
      amount = 1
    }
    if (moniker) {
      amount *= (moniker as ResponseMonikerConfigData).moniker?.amount ?? 1
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

    //
    const options = this.getAirdropOptions(newArgs)

    return {
      sender,
      recipients,
      guildId,
      channelId: msg.channelId,
      amount,
      all: amountArg === "all",
      each: false,
      fullCommand: args.join(" ").trim(),
      duration: options.duration,
      token: cryptocurrency,
      transferType: type ?? "",
      opts: options,
    }
  }

  public async parseMonikerinCmd(args: string[], guildId: string) {
    const { ok, data, log, curl } = await config.getMonikerConfig(guildId)
    if (!ok) {
      throw new APIError({
        description: log,
        curl,
      })
    }
    let newArgs = args
    let moniker
    if (data && Array.isArray(data) && data.length !== 0) {
      const content = args.join(" ").trim()
      data.forEach((v: ResponseMonikerConfigData) => {
        const tmp = v.moniker?.moniker
        if (!tmp) return
        const sym = v.moniker?.token?.token_symbol
        if (!sym) return
        if (content.includes(tmp)) {
          moniker = v
          newArgs = content.replace(tmp, sym).split(SPACES_REGEX)
        }
      })
    } else {
      const {
        ok: okDefault,
        data: dataDefault,
        log: logDefault,
        curl: curlDefault,
      } = await config.getDefaultMoniker()
      if (!okDefault) {
        throw new APIError({
          description: logDefault,
          curl: curlDefault,
        })
      }
      if (
        dataDefault &&
        Array.isArray(dataDefault) &&
        dataDefault.length !== 0
      ) {
        const content = args.join(" ").trim()
        dataDefault.forEach((v: ResponseMonikerConfigData) => {
          const tmp = v.moniker?.moniker
          if (!tmp) return
          const sym = v.moniker?.token?.token_symbol
          if (!sym) return
          if (content.includes(tmp)) {
            moniker = v
            newArgs = content.replace(tmp, sym).split(SPACES_REGEX)
          }
        })
      }
    }
    return {
      newArgs,
      moniker,
    }
  }

  public async parseMessageTip(args: string[]) {
    const { ok, data, log, curl } = await this.getAllTipBotTokens()
    if (!ok) {
      throw new APIError({ description: log, curl })
    }
    let tokenIdx = -1
    if (data && Array.isArray(data) && data.length !== 0) {
      data.forEach((token: any) => {
        const idx = args.findIndex(
          (element) =>
            element.toLowerCase() === token.token_symbol.toLowerCase()
        )
        if (idx !== -1) {
          tokenIdx = idx
        }
      })
    }
    let messageTip = ""
    let newArgs = args
    if (tokenIdx !== -1 && args.length > tokenIdx + 1) {
      const messageTipArr = args.slice(tokenIdx + 1)
      newArgs = args.slice(0, tokenIdx + 1)
      if (args[tokenIdx + 1].toLowerCase() === "each") {
        messageTipArr.shift()
        newArgs.push(args[tokenIdx + 1])
      }
      messageTip = messageTipArr
        .join(" ")
        .replaceAll('"', "")
        .replaceAll("”", "")
        .replaceAll("“", "")
        .trim()
    }
    return {
      newArgs,
      messageTip,
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
    return await this.jsonFetch(`${API_BASE_URL}/tip/assign-contract`, {
      method: "POST",
      body: req,
    })
  }

  async offchainGetUserBalances(query: { userId: string }) {
    return await this.jsonFetch(`${API_BASE_URL}/tip/balances`, {
      method: "GET",
      query,
    })
  }

  async offchainDiscordTransfer(req: RequestOffchainTransferRequest) {
    return await this.jsonFetch(`${API_BASE_URL}/tip/transfer`, {
      method: "POST",
      body: req,
    })
  }

  async offchainDiscordWithdraw(req: RequestOffchainWithdrawRequest) {
    return await this.jsonFetch(`${API_BASE_URL}/tip/withdraw`, {
      method: "POST",
      body: req,
    })
  }

  async getFiatHistoricalData(query: {
    base: string
    target: string
    days?: string
  }) {
    query.days = query.days ?? "30"
    return await this.jsonFetch(
      `${API_BASE_URL}/fiat/historical-exchange-rates`,
      {
        query,
      }
    )
  }

  async getTransactionsHistories(query: {
    sender_id?: string
    receiver_id?: string
    token: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/tip/transactions`, {
      query,
    })
  }

  async createConfigNofityTransaction(req: RequestCreateTipConfigNotify) {
    return await this.jsonFetch(`${API_BASE_URL}/config-channels/tip-notify`, {
      method: "POST",
      body: req,
    })
  }

  async deleteConfigNofityTransaction(id: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config-channels/tip-notify/${id}`,
      {
        method: "DELETE",
      }
    )
  }

  async getListConfigNofityTransaction(query: { guild_id: string }) {
    return await this.jsonFetch(`${API_BASE_URL}/config-channels/tip-notify`, {
      query,
    })
  }

  async getAllTipBotTokens() {
    return await this.jsonFetch(`${API_BASE_URL}/tip/tokens`)
  }
}

export default new Defi()
