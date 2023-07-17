import { CommandInteraction, Message } from "discord.js"
import {
  run as runProcessor,
  renderTokenInfo,
  renderPair,
  renderSingle,
  renderFiatPair,
} from "./processor"
import { MachineConfig, route } from "utils/router"
import { machineConfig as swapMachineConfig } from "commands/swap"

export const machineConfig: (
  swapTo: string,
  context: any,
  initial: string
) => MachineConfig = (to, tickerCtx, initial) => {
  const swapStep1 = swapMachineConfig("swapStep1", { to })
  return {
    id: "ticker",
    initial,
    context: {
      select: {
        ticker: (interaction, _ev, ctx) =>
          renderSingle(interaction, {
            baseCoin: ctx.baseCoin,
            type: ctx.type,
            days: Number(interaction.values.at(0)),
          }),
        tickerPair: (interaction, _ev, ctx) =>
          renderPair(interaction, {
            ...ctx,
            baseCoin: ctx.baseCoin,
            type: ctx.type,
            days: Number(interaction.values.at(0)),
          }),
        tickerFiatPair: (interaction, _ev, ctx) =>
          renderFiatPair({
            ...ctx,
            baseQ: ctx.baseQ,
            targetQ: ctx.targetQ,
            days: Number(interaction.values.at(0)),
          }),
      },
      button: {
        ticker: (interaction, _ev, ctx) => {
          return renderSingle(interaction, {
            baseCoin: ctx.baseCoin,
            type: ctx.type,
            days: ctx.days,
          })
        },
        tickerInfo: (interaction, _ev, ctx) => {
          return renderTokenInfo(interaction, {
            baseCoin: ctx.baseCoin,
            type: ctx.type,
            days: ctx.days,
          })
        },
      },
      ...tickerCtx,
    },
    states: {
      ticker: {
        on: {
          SWAP: "swapStep1",
          CHANGE_TIME_OPTION: "ticker",
          VIEW_INFO: "tickerInfo",
        },
      },
      tickerPair: {
        on: {
          CHANGE_TIME_OPTION: "tickerPair",
        },
      },
      tickerFiatPair: {
        on: {
          CHANGE_TIME_OPTION: "tickerFiatPair",
        },
      },
      tickerInfo: {
        on: {
          VIEW_CHART: "ticker",
        },
      },
      swapStep1,
    },
  }
}

async function run(
  interaction: CommandInteraction,
  baseQ: string,
  targetQ: string,
  isCompare: boolean,
  isFiat: boolean,
  noDefault: boolean
) {
  const {
    context,
    initial = "ticker",
    msgOpts,
  } = await runProcessor(
    interaction,
    baseQ,
    targetQ,
    isCompare,
    isFiat,
    noDefault
  )

  const reply = (await interaction.editReply(msgOpts)) as Message

  route(
    reply,
    interaction,
    machineConfig(baseQ.toUpperCase(), context, initial)
  )
}

export default run
