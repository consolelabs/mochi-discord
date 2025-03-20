import config from "adapters/config"
import { CommandInteraction, Message } from "discord.js"
import { APIError, OriginalMessage } from "errors"
import { ResponseMonikerConfigData } from "types/api"
import mochiPay from "../adapters/mochi-pay"
import { DiscordWalletTransferError } from "../errors/discord-wallet-transfer"
import { parseDiscordToken } from "./commands"
import {
  equalIgnoreCase,
  getAuthor,
  getEmoji,
  hasRole,
  isNotBot,
  isStatus,
} from "./common"
import { SPACE, SPACES_REGEX } from "./constants"
import { getProfileIdByDiscord } from "./profile"
import { formatDigit } from "./defi"

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

export function classifyTipSyntaxTargets(msgContent: string): {
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
      content.toLowerCase().includes(s[0]),
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

export async function parseRecipients(
  msg: Message | CommandInteraction,
  targets: string[],
  fromDiscordId: string,
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
                  .filter(isNotBot)
                  .filter(hasRole(targetId))
                  .filter(isStatus(isOnline))
                return members.map((member) => member.user.id)
              }

              // user
              case isUser: {
                const member = await msg.guild?.members.fetch(targetId)
                if (!member || !isNotBot(member)) return []
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
                      .filter(isNotBot)
                      .filter(isStatus(isOnline))
                      .keys(),
                  )
                }
                return []
              }

              case target.toLowerCase() === "online" &&
                targets.every(
                  (t) =>
                    !parseDiscordToken(t).isChannel &&
                    !parseDiscordToken(t).isRole,
                ): {
                if (!msg.guild?.members) return []
                const members = (await msg.guild.members.fetch())
                  .filter((m) => !m.user.bot)
                  .filter(
                    (mem) =>
                      Boolean(mem.presence?.status) &&
                      mem.presence?.status !== "offline" &&
                      mem.presence?.status !== "invisible",
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
                    .values(),
                )
                return recipients
              }

              // get all
              case target === "all": {
                if (!msg.guild?.members) return []
                const members = (await msg.guild.members.fetch())
                  .filter(isNotBot)
                  .filter(isStatus(isOnline))
                  .filter(
                    (mem) =>
                      mem.roles.cache
                        .map((role) => role.name)
                        .includes("@everyone") ||
                      mem.roles.cache
                        .map((role) => role.name)
                        .includes("@here"),
                  )
                return members.map((member) => member.user.id)
              }
            }
            return []
          }),
        )
      )
        .flat()
        .filter(
          (toDiscordId) => toDiscordId !== "" && toDiscordId !== fromDiscordId,
        ),
    ),
  )
}

export async function parseMonikerinCmd(args: string[], guildId: string) {
  const {
    ok,
    data,
    log,
    curl,
    status = 500,
    error,
  } = await config.getMonikerConfig(guildId)
  if (!ok) {
    throw new APIError({
      description: log,
      curl,
      status,
      error,
    })
  }
  let newArgs = args
  let moniker: ResponseMonikerConfigData | undefined
  if (data?.length) {
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
      status: statusDefault = 500,
      error: errorDefault,
    } = await config.getDefaultMoniker()
    if (!okDefault) {
      throw new APIError({
        description: logDefault,
        curl: curlDefault,
        status: statusDefault,
        error: errorDefault,
      })
    }
    if (dataDefault?.length) {
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

export async function isTokenSupported(symbol: string): Promise<boolean> {
  const {
    ok,
    error,
    curl,
    log,
    data,
    status = 500,
  } = await mochiPay.getTokens({ symbol })
  if (!ok) {
    throw new APIError({ curl, description: log, error, status })
  }
  return data?.length > 0
}

export async function getToken(symbol: string) {
  const {
    ok,
    error,
    curl,
    log,
    data,
    status = 500,
  } = await mochiPay.getTokens({ symbol })
  if (!ok) {
    throw new APIError({ curl, description: log, error, status })
  }
  return data[0]
}

export function getTargets(args: string[]): {
  targets: string[]
  firstIdx: number
  lastIdx: number
  valid: boolean
} {
  const result: {
    targets: string[]
    firstIdx: number
    lastIdx: number
    valid: boolean
  } = {
    targets: [],
    firstIdx: -1,
    lastIdx: -1,
    valid: false,
  }
  let amountUnit: string[] = []
  const amountUnitNoSpaceRegEx = /^((?:\d+(?:[.,]\d+)*)|\d*[.,]\d+)(\D+)$/i
  if (
    /^\d+(,\d+)?(\.\d+)?$/.test(args[1]) ||
    equalIgnoreCase(args[1], "all") ||
    equalIgnoreCase(args[1], "a") ||
    equalIgnoreCase(args[1], "an")
  ) {
    amountUnit = args.splice(1, 2)
  } else if (amountUnitNoSpaceRegEx.test(args[1])) {
    amountUnit = args.splice(1, 1)
  }

  const content = args.join(SPACE)
  for (const [idx, a] of args.entries()) {
    const selector = TIP_TARGET_TEXT_SELECTOR_MAPPINGS.find(
      (s) =>
        s[0].startsWith(a.toLowerCase()) &&
        content.toLowerCase().includes(s[0]),
    )
    // target is one of the selectors "TIP_TARGET_TEXT_SELECTOR_MAPPINGS"
    if (selector) {
      result.targets.push(selector[1])
      result.lastIdx = +idx + selector[0].split(SPACE).length - 1
      result.valid = true
      if (result.firstIdx === -1) result.firstIdx = +idx
      break
    }

    // targets are users / roles / channels
    const { isRole, isChannel, isUser } = parseDiscordToken(a)
    if (isRole || isChannel || isUser) {
      result.targets.push(a)
      result.lastIdx = +idx
      result.valid = true
      if (result.firstIdx === -1) result.firstIdx = +idx
      continue
    }
  }

  // no recipients
  if (!result.targets.length) result.valid = false

  // if first target is not placed in 2nd position -> incorrect syntax
  if (result.firstIdx !== 1) result.valid = false

  if (amountUnit) {
    args.splice(result.lastIdx + 1, 0, ...amountUnit)
  }
  return result
}

export async function parseMoniker(unit: string, guildId: string) {
  // get all moniker configs
  const {
    ok,
    data,
    log,
    curl,
    status = 500,
    error,
  } = await config.getMonikerConfig(guildId)
  if (!ok) {
    throw new APIError({
      description: log,
      curl,
      status,
      error,
    })
  }

  const match = (v: ResponseMonikerConfigData) => {
    const tmp = v.moniker?.moniker
    if (!tmp) return
    const sym = v.moniker?.token?.token_symbol
    if (!sym) return
    const plural = v.moniker?.plural
    return equalIgnoreCase(unit, tmp) || equalIgnoreCase(unit, plural || "")
  }

  // if guild has custom configs, then find the match one
  if (data?.length) {
    const moniker = data?.find(match)
    if (moniker) return moniker
  }

  // else get global monikers
  const {
    ok: okDefault,
    data: dataDefault,
    log: logDefault,
    curl: curlDefault,
    status: statusDefault = 500,
    error: errorDefault,
  } = await config.getDefaultMoniker()
  if (!okDefault) {
    throw new APIError({
      description: logDefault,
      curl: curlDefault,
      status: statusDefault,
      error: errorDefault,
    })
  }

  // and find the match one
  return dataDefault?.find(match)
}

export function parseMessageTip(args: string[], startIdx: number): string {
  return args
    .slice(startIdx)
    .join(SPACE)
    .replaceAll('"', "")
    .replaceAll("”", "")
    .replaceAll("“", "")
    .replaceAll("'", "")
    .trim()
}

// 1ftm, 20butt, 0.2eth, etc...
const amountUnitNoSpaceRegEx = /^(\d+\.*\d*)(\D+)$/i

export function parseTipAmount(
  msgOrInteraction: Message | CommandInteraction,
  amountArg: string,
): { all: boolean; amount: number; unit?: string } {
  // replace "," to "." in amount
  amountArg = amountArg.replace(",", ".")

  if (amountArg.startsWith(".")) {
    amountArg = `0${amountArg}`
  }

  const author = getAuthor(msgOrInteraction)
  const result: { all: boolean; amount: number; unit?: string } = {
    all: false,
    amount: parseFloat(amountArg),
  }
  switch (true) {
    // a, an = 1
    case ["a", "an"].includes(amountArg.toLowerCase()):
      result.amount = 1
      break

    // tip all, let BE calculate amount
    case equalIgnoreCase("all", amountArg):
      result.amount = 0
      result.all = true
      break

    case amountUnitNoSpaceRegEx.test(amountArg): {
      const regExResult = amountArg.match(amountUnitNoSpaceRegEx)
      if (!regExResult)
        throw new DiscordWalletTransferError({
          discordId: author.id,
          message: msgOrInteraction,
          error: "The amount is invalid. Please insert a positive number.",
          title: "Invalid amount",
        })

      const [amount, unit] = regExResult.slice(1)
      const truncated = truncateAmountDecimal(amount)
      result.amount = parseFloat(truncated)
      result.unit = unit
      break
    }

    // invalid amount
    case isNaN(result.amount) || result.amount <= 0:
      throw new DiscordWalletTransferError({
        discordId: author.id,
        message: msgOrInteraction,
        error: "The amount is invalid. Please insert a positive number.",
        title: "Invalid amount",
      })

    default: {
      const truncated = truncateAmountDecimal(amountArg)
      result.amount = parseFloat(truncated)
    }
  }

  return result
}

/**
 * Returns the truncated amount if the inputted amount is automatically rounded.
 * Else returns the inputted amount
 * @param amountArg: inputted amount
 * @param decimal: token decimals
 */
export function truncateAmountDecimal(amountArg: string, decimal = 18): string {
  const amount = Number(amountArg)
  const formatted = formatDigit({
    value: amount.toString(),
    fractionDigits: decimal,
    withoutCommas: true,
  })
  if (amountArg === formatted) return amountArg

  // if the inputted amount and the formatted amount is not the same,
  // that means the formatted amount is automatically rounded so we have to truncate it
  // instead of rounding to avoid insufficient balance error
  let result = ""
  let truncated = false
  for (let i = 0; i < amountArg.length; i++) {
    result += truncated ? "0" : amountArg.charAt(i)
    truncated = amountArg.charAt(i) !== formatted.charAt(i)
  }
  return result
}

export async function isInTipRange(
  msgOrInteraction: Message | CommandInteraction,
  usdVal: number,
) {
  const { data: tipRange } = await config.getTipRangeConfig(
    msgOrInteraction.guildId ?? "",
  )
  const { min, max } = tipRange ?? {}
  const amountOor = (min && usdVal < min) || (max && usdVal > max)
  if (!amountOor) {
    return
  }

  const aPointingRight = getEmoji("ANIMATED_POINTING_RIGHT", true)
  const description = `This server only allow to tip and airdrop in this range:\n${
    min ? `${aPointingRight} Minimum amount: $${min}\n` : ""
  }${max ? `${aPointingRight} Maximum amount: $${max}` : ""}`
  throw new DiscordWalletTransferError({
    message: msgOrInteraction,
    title: "Tipping amount is not allowed!",
    error: description,
  })
}

export async function getBalances({
  msgOrInteraction,
  token,
  profileId = "",
}: {
  msgOrInteraction: OriginalMessage
  token?: string
  profileId?: string
}) {
  if (!profileId) {
    const author = getAuthor(msgOrInteraction)
    profileId = await getProfileIdByDiscord(author.id)
  }
  let balances = []
  const { data, ok } = await mochiPay.getBalances({
    profileId,
    token,
  })
  if (ok) {
    balances = data.filter((b: any) => b.amount !== "0")
  }
  return balances
}

/**
 * Validate if total transfer amount and amount for each recipient is too low (based on token decimals).
 */
export function validateTipAmount({
  msgOrInteraction,
  amount,
  decimal,
  numOfRecipients = 1,
}: {
  msgOrInteraction: Message | CommandInteraction
  amount: number
  decimal: number
  numOfRecipients?: number
}) {
  const min = 1 / Math.pow(10, decimal)
  if (amount < min) {
    throw new DiscordWalletTransferError({
      message: msgOrInteraction,
      discordId: getAuthor(msgOrInteraction).id,
      error: "Amount too low!",
    })
  }

  const maxRecipients = getMaximumRecipients(amount, decimal)
  if (numOfRecipients > maxRecipients) {
    throw new DiscordWalletTransferError({
      message: msgOrInteraction,
      discordId: getAuthor(msgOrInteraction).id,
      error: "You cannot split this amount of tokens between this many people!",
    })
  }
}

/**
 * Returns maximum recipients based on the amount
 * @param amount Transfer amount
 * @param decimal
 */
export function getMaximumRecipients(amount: number, decimal: number): number {
  const min = 1 / Math.pow(10, decimal)
  return Math.floor(amount / min)
}
