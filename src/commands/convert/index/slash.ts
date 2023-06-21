import { render } from "./processor"
import { CommandInteraction, Message } from "discord.js"
import { MachineConfig, route } from "utils/router"
import { executeSwap } from "commands/swap/index/processor"

const machineConfig: (context: any) => MachineConfig = (context) => ({
  id: "convert",
  initial: "previewConversion",
  context: {
    button: {
      previewConversion: (i, _ev, ctx) => executeSwap(i, ctx),
    },
    ...context,
  },
  states: {
    previewConversion: {
      on: {
        SWAP: "previewConversion",
      },
    },
  },
})

const run = async (i: CommandInteraction) => {
  const amount = i.options.getNumber("amount", true)
  const from = i.options.getString("from", true)
  const to = i.options.getString("to", true)
  const { context, msgOpts } = await render(
    i,
    from.toUpperCase(),
    to.toUpperCase(),
    amount
  )
  const reply = (await i.editReply(msgOpts)) as Message

  route(reply, i, machineConfig(context))
}
export default run
