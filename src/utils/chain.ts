export function isEvm(chainType: string): boolean {
  return chainType === chainTypes.EVM
}

export function isSolana(chainType: string): boolean {
  return chainType === chainTypes.SOL
}

export function isTon(chainType: string): boolean {
  return chainType === chainTypes.TON
}

export function isBitcoin(chainType: string): boolean {
  return chainType === chainTypes.BTC
}

export function isRonin(chainType: string): boolean {
  return chainType === chainTypes.RON
}

// TODO: check other locations where change type is defined, replace by this
export const chainTypes = {
  EVM: "evm",
  SOL: "solana",
  TON: "ton",
  BTC: "bitcoin",
  RON: "ronin",
}
