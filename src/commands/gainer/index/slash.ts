import { CommandInteraction } from "discord.js"
import { render, Tab, TimeRange } from "./processor"

const run = (i: CommandInteraction) => {
  const timeRange = (i.options.getString("time") || TimeRange.D1) as TimeRange

  return render(i, Tab.Gainer, timeRange)
}

export default run
