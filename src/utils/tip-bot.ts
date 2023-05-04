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

export async function parseRecipients(
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
                  .filter(isNotBot)
                  .filter(isStatus(isOnline))
                  .filter(
                    (mem) =>
                      mem.roles.cache
                        .map((role) => role.name)
                        .includes("@everyone") ||
                      mem.roles.cache.map((role) => role.name).includes("@here")
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

export async function parseMonikerinCmd(args: string[], guildId: string) {
  const { ok, data, log, curl } = await config.getMonikerConfig(guildId)
  if (!ok) {
    throw new APIError({
      description: log,
      curl,
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
    } = await config.getDefaultMoniker()
    if (!okDefault) {
      throw new APIError({
        description: logDefault,
        curl: curlDefault,
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
  const { ok, error, curl, log, data } = await mochiPay.getTokens({ symbol })
  if (!ok) {
    throw new APIError({ curl, description: log, error })
  }
  return data?.length > 0
}

export async function getToken(symbol: string) {
  const { ok, error, curl, log, data } = await mochiPay.getTokens({ symbol })
  if (!ok) {
    throw new APIError({ curl, description: log, error })
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

  const content = args.join(SPACE)
  for (const [idx, a] of args.entries()) {
    const selector = TIP_TARGET_TEXT_SELECTOR_MAPPINGS.find(
      (s) =>
        s[0].startsWith(a.toLowerCase()) && content.toLowerCase().includes(s[0])
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
  return result
}

export async function parseMoniker(unit: string, guildId: string) {
  // get all moniker configs
  const { ok, data, log, curl } = await config.getMonikerConfig(guildId)
  if (!ok) {
    throw new APIError({
      description: log,
      curl,
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
  } = await config.getDefaultMoniker()
  if (!okDefault) {
    throw new APIError({
      description: logDefault,
      curl: curlDefault,
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
  amountArg: string
): { all: boolean; amount: number; unit?: string } {
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
      result.amount = parseFloat(amount)
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
  }

  return result
}

export async function isInTipRange(
  msgOrInteraction: Message | CommandInteraction,
  usdVal: number
) {
  const { data: tipRange } = await config.getTipRangeConfig(
    msgOrInteraction.guildId ?? ""
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
}: {
  msgOrInteraction: OriginalMessage
  token?: string
}) {
  const author = getAuthor(msgOrInteraction)
  const senderPid = await getProfileIdByDiscord(author.id)
  const { data, ok, curl, log } = await mochiPay.getBalances({
    profileId: senderPid,
    token,
  })
  if (!ok) {
    throw new APIError({ msgOrInteraction, curl, description: log })
  }
  return data.filter((b: any) => b.amount !== "0")
}

export function rejectTooLowSplitTransferAmount(
  msgOrInteraction: Message | CommandInteraction,
  token: string
) {
  throw new DiscordWalletTransferError({
    message: msgOrInteraction,
    error: `You cannot split this amount of ${token} among this many people.`,
  })
}

export function rejectTooLowTransferAmount(
  msgOrInteraction: Message | CommandInteraction,
  token: string
) {
  throw new DiscordWalletTransferError({
    message: msgOrInteraction,
    error: `Amount too low for ${token}.`,
  })
}

export function isAmountTooLow(amount: number, decimal: number) {
  const minAmount = 1 * Math.pow(10, decimal)
  return amount < minAmount
}
