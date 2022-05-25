export type LineStats = {
  from: number
  to: number
}

export type Coordinate = {
  x: number
  y: number
}

export type RectangleStats = {
  x: LineStats
  y: LineStats
  w: number
  h: number
}
