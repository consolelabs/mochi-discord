import { CommandInteraction, Message } from "discord.js"
import { render, Tab, TimeRange } from "commands/gainer/index/processor"
import { machineConfig } from "commands/gainer/index/slash"
import { route } from "utils/router"

const run = async (i: CommandInteraction) => {
  const timeRange = (i.options.getString("time") || TimeRange.D1) as TimeRange
  const { msgOpts, initial } = await render(i, Tab.Loser, timeRange)
  const reply = (await i.editReply(msgOpts)) as Message

  route(reply, i, machineConfig(initial))
}

export default run
