import { allowedCurrencies } from "commands/defi/ticker/compare"

export function isValidFiatPair(symbols: string[]): boolean {
  // 2 different fiats and 1 is USD
  if (
    (symbols[0] !== symbols[1] &&
      symbols[0] === "usd" &&
      allowedCurrencies.includes(symbols[1].toLowerCase())) ||
    (symbols[1] === "usd" &&
      allowedCurrencies.includes(symbols[0].toLowerCase()))
  ) {
    return true
  }
  return false
}
