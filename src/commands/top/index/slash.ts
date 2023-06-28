import { CommandInteraction, Message } from "discord.js"
import { MachineConfig, route, RouterSpecialAction } from "utils/router"
import { render } from "./processor"

const machineConfig: MachineConfig = {
  id: "top",
  initial: "topServerXp",
  context: {
    button: {
      topServerXp: (i, _ev, ctx) => render(i, ctx.page),
    },
    page: 0,
  },
  states: {
    topServerXp: {
      on: {
        [RouterSpecialAction.PREV_PAGE]: "topServerXp",
        [RouterSpecialAction.NEXT_PAGE]: "topServerXp",
      },
    },
  },
}

export const run = async (i: CommandInteraction) => {
  const { msgOpts } = await render(i)
  const reply = (await i.editReply(msgOpts)) as Message

  route(reply, i, machineConfig)
}
