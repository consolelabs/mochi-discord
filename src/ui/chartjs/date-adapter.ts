import Chart from "chart.js"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import isoWeek from "dayjs/plugin/isoWeek"
dayjs.extend(customParseFormat)
dayjs.extend(isoWeek)

const FORMATS = {
  datetime: "MMM D, YYYY, h:mm:ss a",
  millisecond: "h:mm:ss.SSS a",
  second: "h:mm:ss a",
  minute: "h:mm a",
  hour: "hA",
  day: "MMM D",
  week: "ll",
  month: "MMM YYYY",
  quarter: "[Q]Q - YYYY",
  year: "YYYY",
}

Chart._adapters._date.override({
  formats: function () {
    return FORMATS
  },

  parse: function (value, format) {
    if (typeof value === "string" && typeof format === "string") {
      value = dayjs(value, format)
    }
    return 0
  },

  format: function (time, format) {
    return dayjs(time).format(format)
  },

  add: function (time, amount, unit) {
    if (unit === "quarter")
      return dayjs(time)
        .add(3 * amount, "month")
        .valueOf()
    return dayjs(time).add(amount, unit).valueOf()
  },

  diff: function (max, min, unit) {
    return dayjs(max).diff(dayjs(min), unit)
  },

  startOf: function (time, unit, weekday) {
    if (unit === "quarter") return 0
    if (unit === "isoWeek")
      return dayjs(time)
        .isoWeekday(weekday ?? 0)
        .valueOf()
    return dayjs(time).startOf(unit).valueOf()
  },

  endOf: function (time, unit) {
    if (unit === "quarter") return 0
    return dayjs(time).endOf(unit).valueOf()
  },
})
