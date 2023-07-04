import { CommandInteraction, Message } from "discord.js"
import { MachineConfig, route } from "utils/router"
import { BalanceView, BalanceType, renderAllBalances } from "./processor"

export const machineConfig: (
  context: any,
  discordId?: string
) => MachineConfig = () => ({
  id: "info",
})

const run = async (i: CommandInteraction) => {
  const view = i.options.getBoolean("expand", false)
    ? BalanceView.Expand
    : BalanceView.Compact
  const { context, msgOpts } = await renderAllBalances(i.user.id, {
    interaction: i,
    type: BalanceType.All,
    address: "",
    view,
  })

  const reply = (await i.editReply(msgOpts)) as Message

  route(reply, i, machineConfig(context, i.member?.user.id))
}
export default run
