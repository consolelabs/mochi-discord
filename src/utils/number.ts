export function doMath({
  x,
  y,
  operation,
}: {
  x: string
  y: string
  operation: "mul" | "div"
}) {
  // get index of decimal points
  const xDecimalPointReverseIdx = x.length - x.indexOf(".")
  const yDecimalPointReverseIdx = y.length - y.indexOf(".")

  // temporarily remove decimal point from values so that we can parse them into BigInt
  const tempX = x.replace(".", "")
  const tempY = y.replace(".", "")
  const bigX = BigInt(tempX)
  const bigY = BigInt(tempY)

  // do the calculation
  let result: bigint
  switch (operation) {
    case "mul":
      result = bigX * bigY
      break
    case "div":
      result = bigX / bigY
      break
  }

  // need to know where to put back the decimal point
  const numOfFractions = xDecimalPointReverseIdx + yDecimalPointReverseIdx
  // if x or y has decimal point, we have to subtract them as well (length = 1)
  const xDecPointLength = x.includes(".") ? 1 : 0
  const yDecPointLength = y.includes(".") ? 1 : 0
  const newDecimalPointIdx =
    result.toString().length -
    numOfFractions -
    xDecPointLength -
    yDecPointLength

  // this case occurs when result length <= number of fraction digits
  // so that we need to push zeros before and place decimal point at 2nd position
  if (newDecimalPointIdx <= 0) {
    const zeros = Array(Math.abs(newDecimalPointIdx - 1))
      .fill("0")
      .join("")
    const prefix = zeros.slice(0, 1) + "." + zeros.slice(1)
    return `${prefix}${result.toString()}`
  }

  // else, just put decimal point at index "newDecimalPointIdx"
  return `${result.toString().slice(0, newDecimalPointIdx)}.${result
    .toString()
    .slice(newDecimalPointIdx)}`
}
