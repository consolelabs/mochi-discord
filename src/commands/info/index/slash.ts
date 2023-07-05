import { CommandInteraction, Message } from "discord.js"
import { route } from "utils/router"
import {
  BalanceView,
  BalanceType,
  renderBalances,
} from "commands/balances/index/processor"
import { machineConfig } from "commands/balances/index/slash"

const run = async (i: CommandInteraction) => {
  const view = i.options.getBoolean("expand", false)
    ? BalanceView.Expand
    : BalanceView.Compact
  const { context, msgOpts } = await renderBalances(i.user.id, {
    interaction: i,
    type: BalanceType.All,
    address: "",
    view,
  })

  const reply = (await i.editReply(msgOpts)) as Message

  route(reply, i, machineConfig(context, i.member?.user.id))
}
export default run
