type LineStats = {
  from: number
  to: number
}

export type TextStats = {
  x: number
  y: number
} & PositionStats

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

export type RoundedRectangleStats = {
  x: number
  y: number
  w: number
  h: number
  radius: number
} & PositionStats

export type CircleleStats = {
  x: number
  y: number
  radius: number
  outlineColor?: string
} & PositionStats
