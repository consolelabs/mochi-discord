import { CommandInteraction, GuildMember, Message } from "discord.js"
import { MachineConfig, route } from "utils/router"
import { BalanceType, BalanceView, renderBalances } from "./processor"

export const machineConfig: (
  context: any,
  member?: GuildMember
) => MachineConfig = (context, member) => ({
  id: "balance",
  initial: "balance",
  context: {
    button: {
      balance: (i, ev, ctx) =>
        renderBalances(member?.user.id ?? i.user.id, {
          ...ctx,
          showFullEarn:
            ev === "TOGGLE_SHOW_FULL_EARN"
              ? !ctx.showFullEarn
              : ctx.showFullEarn,
          interaction: i,
          address: ctx.address,
          type: ctx.type,
        }),
    },
    select: {
      balance: async (i, _ev, ctx) => {
        const [, type, address = ""] = i.values[0].split("_")
        let fetcherType = ctx.type ?? BalanceType.Offchain
        if (type.startsWith("mochi")) fetcherType = BalanceType.Offchain
        if (type.startsWith("onchain")) fetcherType = BalanceType.Onchain
        if (type.startsWith("cex")) fetcherType = BalanceType.Cex

        return await renderBalances(member?.user.id ?? i.user.id, {
          interaction: i,
          type: fetcherType,
          address,
        })
      },
    },
    ...context,
  },
  states: {
    balance: {
      on: {
        TOGGLE_SHOW_FULL_EARN: "balance",
      },
    },
  },
})

const run = async (i: CommandInteraction) => {
  const view = i.options.getBoolean("expand", false)
    ? BalanceView.Expand
    : BalanceView.Compact
  const { context, msgOpts } = await renderBalances(i.user.id, {
    interaction: i,
    type: BalanceType.Offchain,
    address: "",
    view,
  })

  const reply = (await i.editReply(msgOpts)) as Message

  route(reply, i, machineConfig(context, i.member as GuildMember))
}
export default run
