import { APIError, OriginalMessage } from "errors"
import { getAuthor } from "./common"
import defi from "adapters/defi"
import { InsufficientBalanceError } from "errors/insufficient-balance"

const allowedFiats = ["gbp", "usd", "eur", "sgd", "vnd"]

export function parseFiatQuery(q: string): string[] {
  q = q.toLowerCase()
  // normal format (e.g. usd/vnd)
  if (q.includes("/")) {
    const [base, target] = q.split("/")
    if (!allowedFiats.includes(base) || !allowedFiats.includes(target)) {
      return []
    }
    return [base, target]
  }
  // simplified format (e.g. eursgd)
  const base = allowedFiats.filter((f) => q.startsWith(f))[0]
  if (!base) return []
  // check if target is specified. else fallback to "usd" (e.g. gbp)
  const target = q.substring(base.length) ? q.substring(base.length) : "usd"
  // validate
  if (base === target) return []
  return [base, target]
}

export function parseTickerQuery(q: string) {
  q = q.toLowerCase()
  let isCompare = false
  let isFiat = false
  let [base, target] = q.split("/")
  if (target) {
    isCompare = true
    isFiat = allowedFiats.includes(base) && allowedFiats.includes(target)
  } else {
    const fiatBase = allowedFiats.find((f) => q.startsWith(f))
    if (fiatBase) {
      base = fiatBase
      target = q.substring(base.length) || "usd"
      isCompare = true
      isFiat = true
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
  msgOrInteraction: OriginalMessage
  token: string
  amount: number
  all?: boolean
}) {
  const author = getAuthor(msgOrInteraction)
  const { ok, data, log, curl } = await defi.offchainGetUserBalances({
    userId: author.id,
  })
  if (!ok)
    throw new APIError({
      msgOrInteraction: msgOrInteraction,
      curl,
      description: log,
    })
  //
  const tokenBalance = data.find(
    (item) => token.toLowerCase() === item.symbol?.toLowerCase()
  ) ?? { balances: 0, balances_in_usd: 0 }
  const { balances = 0, balances_in_usd = 0 } = tokenBalance
  if (!balances || (balances < amount && !all)) {
    throw new InsufficientBalanceError({
      msgOrInteraction,
      params: {
        current: balances,
        required: amount,
        symbol: token,
      },
    })
  }
  return { balance: balances, usdBalance: balances_in_usd }
}
