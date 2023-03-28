export function convertString(
  amount: string,
  decimals: number,
  toBigint?: boolean
) {
  if (!decimals || !amount) return 0
  return toBigint
    ? +amount * Math.pow(10, decimals)
    : +amount / Math.pow(10, decimals)
}
