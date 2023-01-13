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
