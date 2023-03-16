export function ConvertSecondToMinute(second: number): string {
  if (second <= 30) {
    return second.toString() + "s"
  }
  const minute = second / 60
  return Math.round(minute).toString() + "m"
}
