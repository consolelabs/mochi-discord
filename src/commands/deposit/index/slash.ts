import { CommandInteraction, Message } from "discord.js"
import { equalIgnoreCase } from "utils/common"
import { MachineConfig, route } from "utils/router"
import * as processor from "./processor"

const machineConfig: (
  token: string,
  amount: number,
  context: any
) => MachineConfig = (token, amount, context) => ({
  id: "deposit",
  initial: "depositList",
  context: {
    button: {
      depositList: async (i) => await processor.deposit(i, token),
    },
    select: {
      depositDetail: async (i, _ev, ctx) => {
        return {
          msgOpts: await processor.depositDetail(
            i,
            amount,
            ctx.addresses.find((a: any) =>
              equalIgnoreCase(a.address, i.values.at(0))
            )
          ),
        }
      },
    },
    ...context,
  },
  states: {
    depositList: {
      on: {
        VIEW_DEPOSIT_ADDRESS: "depositDetail",
      },
    },
    depositDetail: {
      on: {
        BACK: "depositList",
      },
    },
  },
})

export const run = async (
  i: CommandInteraction,
  tokenSymbol: string,
  amount: number
) => {
  const { msgOpts, context } = await processor.deposit(i, tokenSymbol)
  const reply = (await i.followUp({
    ephemeral: true,
    fetchReply: true,
    ...msgOpts,
  })) as Message

  route(reply, i, machineConfig(tokenSymbol, amount, context))
}

export default run
