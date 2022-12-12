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
