import { CommandInteraction, Message } from "discord.js"
import { MachineConfig, route } from "utils/router"
import { render, Tab, TimeRange } from "./processor"

export const machineConfig: (initial: string) => MachineConfig = (initial) => ({
  id: "gainer-loser",
  initial,
  context: {
    button: {
      gainer: (i, _ev, ctx) => render(i, Tab.Gainer, ctx.timeRange),
      loser: (i, _ev, ctx) => render(i, Tab.Loser, ctx.timeRange),
    },
    select: {
      gainer: (i) => render(i, Tab.Gainer, i.values.at(0) as TimeRange),
      loser: (i) => render(i, Tab.Loser, i.values.at(0) as TimeRange),
    },
  },
  states: {
    gainer: {
      on: {
        VIEW_LOSER: "loser",
        CHANGE_TIME: "gainer",
      },
    },
    loser: {
      on: {
        VIEW_GAINER: "gainer",
        CHANGE_TIME: "loser",
      },
    },
  },
})

const run = async (i: CommandInteraction) => {
  const timeRange = (i.options.getString("time") || TimeRange.D1) as TimeRange

  const { msgOpts, initial } = await render(i, Tab.Gainer, timeRange)
  const reply = (await i.editReply(msgOpts)) as Message

  route(reply, i, machineConfig(initial))
}

export default run
