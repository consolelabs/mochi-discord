import { CommandInteraction, Message } from "discord.js"
import { APIError } from "errors"
import { InsufficientBalanceError } from "errors/insufficient-balance"
import mochiPay from "../adapters/mochi-pay"
import { getAuthor, TokenEmojiKey } from "./common"
import { convertString } from "./convert"
import { getProfileIdByDiscord } from "./profile"

export function formatDigit(str: string, fractionDigits = 6, force = false) {
  const num = Number(str)
  const s = num.toLocaleString(undefined, { maximumFractionDigits: 18 })
  const [left, right = ""] = s.split(".")
  if (Number(right) === 0 || right === "" || left.length >= 4) return left
  const numsArr = right.split("")
  let rightStr = numsArr.shift() as string
  if (!force) {
    while (Number(rightStr) === 0 || rightStr.length < fractionDigits) {
      const nextDigit = numsArr.shift()
      if (!nextDigit) break
      rightStr += nextDigit
    }
  } else {
    rightStr += numsArr.slice(0, fractionDigits - 1)
  }
  while (rightStr.endsWith("0")) {
    rightStr = rightStr.slice(0, rightStr.length - 1)
  }
  return left + "." + rightStr
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
  const { ok, data, log, curl } = await mochiPay.getBalances({
    profileId,
    token,
  })
  if (!ok) throw new APIError({ msgOrInteraction, curl, description: log })
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
