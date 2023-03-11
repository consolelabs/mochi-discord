import { APIError, OriginalMessage } from "errors"
import { getAuthor } from "./common"
import defi from "adapters/defi"
import { InsufficientBalanceError } from "errors/insufficient-balance"

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
