import defi from "adapters/defi"
import { APIError } from "errors"

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

export async function tipTokenIsSupported(symbol: string): Promise<boolean> {
  const { ok, error, curl, log, data } = await defi.getAllTipBotTokens()
  if (!ok) {
    throw new APIError({ curl, description: log, error })
  }
  const tokens = data.map((t: any) => t.token_symbol.toUpperCase())
  if (tokens.includes(symbol.toUpperCase())) return true
  return false
}
