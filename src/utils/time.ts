export function ConvertSecondToMinute(second: number): string {
  if (second <= 30) {
    return second.toString() + "s"
  }
  const minute = second / 60
  return Math.round(minute).toString() + "m"
}

export function GetDateComponents(d: Date) {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  return {
    day: ("0" + `${d.getDate()}`).slice(-2),
    month: ("0" + `${d.getMonth() + 1}`).slice(-2),
    monthName: monthNames[d.getMonth()],
    year: d.getFullYear(),
    minute: ("0" + `${d.getMinutes()}`).slice(-2),
    time: d.getHours() > 12 ? "PM" : "AM",
    hour: (
      "0" + `${d.getHours() > 12 ? d.getHours() - 12 : d.getHours()}`
    ).slice(-2),
  }
}
