import { CommandInteraction, Message } from "discord.js"
import {
  run as runProcessor,
  composeTokenInfoEmbed,
  renderPair,
  renderSingle,
  renderFiatPair,
} from "./processor"
import { MachineConfig, route } from "utils/router"
import { machineConfig as swapMachineConfig } from "commands/swap"

const machineConfig: (
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
        ticker: (interaction, ev, ctx) =>
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
        ticker: (interaction, ev, ctx) => {
          switch (true) {
            case ev === "VIEW_CHART":
              return renderSingle(interaction, {
                baseCoin: ctx.baseCoin,
                type: ctx.type,
                days: ctx.days,
              })
            case ev === "VIEW_INFO":
              return composeTokenInfoEmbed(interaction, {
                baseCoin: ctx.baseCoin,
                days: ctx.days,
                type: ctx.type,
              })
          }
        },
      },
      ...tickerCtx,
    },
    states: {
      ticker: {
        on: {
          SWAP: "swapStep1",
          CHANGE_TIME_OPTION: "ticker",
          VIEW_INFO: "ticker",
          VIEW_CHART: "ticker",
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
      swapStep1,
    },
  }
}

async function run(
  interaction: CommandInteraction,
  baseQ: string,
  targetQ: string,
  isCompare: boolean,
  isFiat: boolean
) {
  const {
    context,
    initial = "ticker",
    msgOpts,
  } = await runProcessor(interaction, baseQ, targetQ, isCompare, isFiat)

  const reply = (await interaction.editReply(msgOpts)) as Message

  route(
    reply,
    interaction,
    machineConfig(baseQ.toUpperCase(), context, initial)
  )
}

export default run
