const horizontalPos = ["a", "b", "c", "d", "e", "f"]

export function normalizePosition(input: string) {
  const [_a, _b, _c] = input.split("")
  if (_c) return false
  const a = Number(_a),
    b = Number(_b)

  switch (true) {
    case !Number.isNaN(b) &&
      Number.isNaN(a) &&
      horizontalPos.includes(_a.toLowerCase()):
      return [horizontalPos.findIndex((p) => p === _a.toLowerCase()), 6 - b]
    case !Number.isNaN(a) &&
      Number.isNaN(b) &&
      horizontalPos.includes(_b.toLowerCase()):
      return [horizontalPos.findIndex((p) => p === _b.toLowerCase()), 6 - a]
    default:
      return false
  }
}
