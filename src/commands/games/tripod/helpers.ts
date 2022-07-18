const horizontalPos = ["a", "b", "c", "d", "e", "f"]

export function toBoardPosition(input: string) {
  const [_a, _b, _c] = input.split("")
  if (_c || !_a || !_b) return false
  const a = Number(_a),
    b = Number(_b)

  if (a < 1 || a > 6 || b < 1 || b > 6) return false

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

export function fromBoardPosition(x: number, y: number) {
  if (x < 0 || x > 5 || y < 0 || y > 5) return false

  return `${horizontalPos[x]}${6 - y}`
}
