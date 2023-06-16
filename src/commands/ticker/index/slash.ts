import { CommandInteraction, Message } from "discord.js"
import { composeTickerResponse, ticker } from "./processor"
import { MachineConfig, route } from "utils/router"
import { machineConfig as swapMachineConfig } from "commands/swap"

const machineConfig: (swapTo: string, context: any) => MachineConfig = (
  to,
  tickerCtx
) => {
  const swapStep1 = swapMachineConfig("swapStep1", { to })
  return {
    id: "ticker",
    initial: "ticker",
    context: {
      select: {
        ticker: (interaction, _ev, ctx) =>
          composeTickerResponse({
            days: Number(interaction.values.at(0)),
            interaction,
            isDominanceChart: ctx.isDominanceChart,
            coinId: ctx.coinId,
            chain: ctx.chain,
            symbol: ctx.symbol,
          }),
      },
      ...tickerCtx,
    },
    states: {
      ticker: {
        on: {
          SWAP: "swapStep1",
          CHANGE_TIME_OPTION: "ticker",
        },
      },
      swapStep1,
    },
  }
}

async function run(
  interaction: CommandInteraction,
  baseQ: string,
  chain?: string
) {
  const { context, msgOpts } = await ticker(interaction, baseQ, chain)

  const reply = (await interaction.editReply(msgOpts)) as Message

  route(reply, interaction, machineConfig(baseQ.toUpperCase(), context))
}

export default run
