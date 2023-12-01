import { CommandInteraction, Message } from "discord.js"
import { APIError } from "errors"
import { InsufficientBalanceError } from "errors/insufficient-balance"
import mochiPay from "../adapters/mochi-pay"
import { getAuthor, TokenEmojiKey } from "./common"
import { convertString } from "./convert"
import { getProfileIdByDiscord } from "./profile"
import { COMMA, EMPTY } from "./constants"

export function formatPercentDigit(
  params: Parameters<typeof formatDigit>[0] | string | number,
) {
  if (typeof params === "string" || typeof params === "number") {
    return formatDigit({
      value: +params,
      fractionDigits: +params >= 10 ? 0 : 2,
    })
  }
  if (!params) return ""
  return formatDigit({
    ...params,
    fractionDigits: +params.value >= 10 ? 0 : 2,
  })
}

export function formatUsdDigit(
  params: Parameters<typeof formatDigit>[0] | string | number,
) {
  if (typeof params === "string" || typeof params === "number") {
    return formatDigit({
      value: +params,
      fractionDigits: +params >= 100 ? 0 : 2,
    })
  }
  if (!params) return ""
  return formatDigit({
    ...params,
    fractionDigits: +params.value >= 100 ? 0 : 2,
  })
}

export function formatTokenDigit(
  params: Parameters<typeof formatDigit>[0] | string | number,
) {
  if (typeof params === "string" || typeof params === "number") {
    return formatDigit({
      value: +params,
      fractionDigits: +params >= 1000 ? 0 : 2,
    })
  }
  if (!params) return ""
  return formatDigit({
    ...params,
    fractionDigits: +params.value >= 1000 ? 0 : 2,
  })
}

export function formatDigit({
  value,
  fractionDigits = 6,
  withoutCommas = false,
  shorten = false,
  scientificFormat = false,
}: {
  value: string | number
  fractionDigits?: number
  withoutCommas?: boolean
  shorten?: boolean
  scientificFormat?: boolean
}) {
  const num = Number(String(value).replaceAll(COMMA, EMPTY))

  // invalid number -> keeps value the same and returns
  if (!num) return String(value)

  // return shorten scientific number if original value is in scientific format . e.g. 1.123e-5
  if (String(num).includes("e") && scientificFormat) {
    return shortenScientificNotation({ value: String(num) })
  }

  const s = num.toLocaleString(undefined, { maximumFractionDigits: 18 })
  const [left, right = ""] = s.split(".")
  const numsArr = right.split("")
  let rightStr = (numsArr.shift() as string) || ""
  while (Number(rightStr) === 0 || rightStr.length < fractionDigits) {
    const nextDigit = numsArr.shift()
    if (nextDigit === undefined) break
    rightStr += nextDigit
  }

  // only truncate to fractionDigits if the result is non zero
  // otherwise we keep the current format because
  // if we truncate we might accidentally make it zero
  if (Number(rightStr.slice(0, fractionDigits)) !== 0) {
    rightStr = rightStr.slice(0, fractionDigits)
  }

  while (rightStr.endsWith("0")) {
    rightStr = rightStr.slice(0, rightStr.length - 1)
  }
  // if shorten mode ON -> needs to be a valid Number (no commas)
  withoutCommas = shorten || withoutCommas
  const leftStr = withoutCommas ? left.replaceAll(COMMA, EMPTY) : left
  const result = `${leftStr}${
    fractionDigits !== 0 && rightStr.length ? `.${rightStr}` : ""
  }`
  if (!shorten || !Number(result)) return result

  // shorten number. e.g. 3000 -> 3K
  return Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(Number(result))
}

export function isValidTipAmount(str: string, decimal: number) {
  const s = formatDigit({ value: str, fractionDigits: decimal })
  if (s === "0") return false
  const numOfFracDigits = s.split(".")[1]?.length ?? 0
  return numOfFracDigits <= decimal
}

export function parseTickerQuery(q: string) {
  const fiats = ["gbp", "usd", "eur", "sgd", "vnd"]
  q = q.toLowerCase()
  let isCompare = false
  let isFiat = false
  let [base, target] = q.split("/")
  if (target) {
    isCompare = true
    isFiat = fiats.includes(base) && fiats.includes(target)
  } else {
    const fiatBase = fiats.find((f) => q.startsWith(f))
    if (fiatBase) {
      const fiatTarget = q.substring(fiatBase.length) || "usd"
      isFiat = fiats.includes(fiatBase) && fiats.includes(fiatTarget)
      base = isFiat ? fiatBase : q
      target = isFiat ? fiatTarget : ""
      isCompare = isFiat
    }
  }
  return { isCompare, isFiat, base, target }
}

export async function validateBalance({
  msgOrInteraction,
  token,
  amount,
  all,
}: {
  msgOrInteraction: Message | CommandInteraction
  token: TokenEmojiKey
  amount: number
  all?: boolean
}) {
  const author = getAuthor(msgOrInteraction)
  const profileId = await getProfileIdByDiscord(author.id)
  const {
    ok,
    data,
    log,
    curl,
    status = 500,
    error,
  } = await mochiPay.getBalances({
    profileId,
    token,
  })
  if (!ok)
    throw new APIError({
      msgOrInteraction,
      curl,
      description: log,
      status,
      error,
    })
  //
  const tokenBalance = data?.[0] ?? { amount: "0" }
  const { amount: balanceAmount = "0" } = tokenBalance
  const balance = convertString(balanceAmount, tokenBalance?.token?.decimal)
  const usdBalance = tokenBalance?.token?.price ?? 0
  if (!balance || (balance < amount && !all)) {
    throw new InsufficientBalanceError({
      msgOrInteraction,
      params: {
        current: balance,
        required: amount,
        symbol: token,
      },
    })
  }
  return { balance, usdBalance }
}

export function isNaturalNumber(n: number) {
  return n >= 0 && Math.floor(n) === n
}

export function shortenScientificNotation({
  value,
  maximumFractionDigits = 2,
}: {
  value: string | number
  maximumFractionDigits?: number
}): string {
  const str = String(value)
  if (!Number(str)) return str
  if (!str.includes("e")) return str

  const delemiterIdx = str.indexOf("e")
  const leftStr = Number(str.slice(0, delemiterIdx)).toLocaleString(undefined, {
    maximumFractionDigits,
  })
  const rightStr = str.slice(delemiterIdx)
  return leftStr + rightStr
}
