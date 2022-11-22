import { allowedFiats } from "commands/defi/ticker/compare"

export function isValidFiatPair(symbols: string[]): boolean {
  if (symbols[0].toLowerCase() === symbols[1].toLowerCase()) return false
  if (!allowedFiats.includes(symbols[0].toLowerCase())) return false
  if (!allowedFiats.includes(symbols[1].toLowerCase())) return false
  return true
}
