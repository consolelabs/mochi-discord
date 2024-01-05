import { CommandInteraction, Message } from "discord.js"
import {
  run as runProcessor,
  renderTokenInfo,
  renderPair,
  renderSingle,
  renderFiatPair,
  renderOtherTicker,
} from "./processor"
import { MachineConfig, route } from "utils/router"
import { machineConfig as swapMachineConfig } from "commands/swap"
import { addToWatchlistFromTicker } from "../../watchlist/add/processor"
import defi from "adapters/defi"
import CacheManager from "cache/node-cache"

export const machineConfig: (
  swapTo: string,
  context: any,
  initial: string,
) => MachineConfig = (to, tickerCtx, initial) => {
  const swapStep1 = swapMachineConfig("swapStep1", { to })
  return {
    id: "ticker",
    initial,
    context: {
      select: {
        ticker: async (interaction, _ev, ctx) => {
          if (ctx.isOtherTicker) {
            const baseCoinRaw = ctx.listCoins.find(
              (c: any) => c.id === interaction.values.at(0),
            )
            let data
            ;({ data } = await CacheManager.get({
              pool: "ticker",
              key: `ticker-getcoin-${baseCoinRaw.id}`,
              ttl: 30,
              call: () => defi.getCoin(baseCoinRaw.id, false),
            }))

            return renderSingle(interaction, {
              baseCoin: data,
              type: ctx.type,
              days: ctx.days,
              listCoins: ctx.listCoins,
            })
          }
          // this is show all token, in this case coins =[...] baseCoin == undefined
          // coins = list defi.getCoin() of all token, baseCoin = defi.GetCoin() of 1 token
          if (ctx.coins && !ctx.baseCoin) {
            const data = ctx.coins.filter(
              (c: any) => c.id === interaction.values.at(0),
            )[0]

            return renderSingle(interaction, {
              baseCoin: data,
              type: ctx.type,
              days: ctx.days,
            })
          }
          return renderSingle(interaction, {
            baseCoin: ctx.baseCoin,
            type: ctx.type,
            days: Number(interaction.values.at(0)),
          })
        },
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
        addWatchList: async (interaction, _ev, ctx) => {
          return await addToWatchlistFromTicker(
            interaction,
            interaction.user.id,
            ctx.to,
            ctx.baseCoin.id,
          )
        },
        showOtherTicker: (interaction, _ev, ctx) => {
          return renderOtherTicker(interaction, {
            baseCoin: ctx.baseCoin,
            type: ctx.type,
            days: ctx.days,
            listCoins: ctx.listCoins,
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
          ADD_TO_WATCHLIST: "addWatchList",
          SHOW_OTHER_TICKER: "showOtherTicker",
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
          ADD_TO_WATCHLIST: "addWatchList",
        },
      },
      tickerAll: {
        on: {
          VIEW_ALL_TICKER: "ticker",
        },
      },
      swapStep1,
      addWatchList: {
        on: {
          VIEW_CHART: "ticker",
        },
      },
      showOtherTicker: {
        on: {
          VIEW_CHART: "showOtherTicker",
          CHANGE_TICKER_OPTION: "ticker",
        },
      },
    },
  }
}

async function run(
  interaction: CommandInteraction,
  baseQ: string,
  targetQ: string,
  isCompare: boolean,
  isFiat: boolean,
  showAll: boolean,
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
    showAll,
  )

  const reply = (await interaction.editReply(msgOpts)) as Message

  route(
    reply,
    interaction,
    machineConfig(baseQ.toUpperCase(), context, initial),
  )
}

export default run
