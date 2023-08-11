import { CommandInteraction, Message } from "discord.js"
import { render } from "./processor"
import { MachineConfig, RouterSpecialAction, route } from "utils/router"

const machineConfig: (ctx?: any) => MachineConfig = (context) => ({
  id: "transaction",
  initial: "transaction",
  context: {
    button: {
      transaction: (i, _ev, ctx) => render(i, ctx.page),
    },
    page: 0,
    ...context,
  },
  states: {
    transaction: {
      on: {
        [RouterSpecialAction.NEXT_PAGE]: "transaction",
        [RouterSpecialAction.PREV_PAGE]: "transaction",
      },
    },
  },
})

const run = async (i: CommandInteraction) => {
  const { context, msgOpts } = await render(i, 0)
  const reply = (await i.editReply(msgOpts)) as Message
  route(reply, i, machineConfig(context))
}

export default run
