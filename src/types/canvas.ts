export type LineStats = {
  from: number
  to: number
}

export type Coordinate = {
  x: number
  y: number
}

type PositionStats = {
  ml?: number
  mr?: number
  mt?: number
  mb?: number
  pl?: number
  pr?: number
  pt?: number
  pb?: number
}

export type RectangleStats = {
  x: LineStats
  y: LineStats
  w: number
  h: number
  radius: number
  overlayColor?: string
  bgColor?: string
} & PositionStats

export type CircleleStats = {
  x: number
  y: number
  radius: number
  outlineColor?: string
} & PositionStats
