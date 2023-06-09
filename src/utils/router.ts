import {
  composeWatchlist,
  WatchListViewType,
} from "commands/watchlist/view/processor"
import { render as renderTrackingWallets } from "commands/wallet/list/processor"
import {
  ButtonInteraction,
  GuildMember,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEditOptions,
  SelectMenuInteraction,
  User,
} from "discord.js"
import {
  BaseActionObject,
  createMachine,
  interpret,
  StatesConfig,
} from "xstate"
import { authorFilter, getEmoji } from "./common"
import { stack } from "./stack-trace"
import { wrapError } from "./wrap-error"
import { handleWalletAddition } from "commands/wallet/add/processor"
import { BalanceType, renderBalances } from "commands/balances/index/processor"
import { runGetVaultDetail } from "commands/vault/info/processor"
import { render as renderQr, viewQR } from "commands/qr/index/processor"
import {
  airdropDetail,
  run as renderAirdrops,
} from "commands/earn/airdrop/processor"
import { trackWallet } from "commands/wallet/track/processor"
import { followWallet } from "commands/wallet/follow/processor"
import { copyWallet } from "commands/wallet/copy/processor"
import { untrackWallet } from "commands/wallet/remove/processor"
import CacheManager from "cache/node-cache"

const routerCache = CacheManager.init({
  pool: "router-store",
  ttl: 0,
  checkperiod: 0,
})

type Handler<P = any> = (
  params: P,
  event: string,
  context: Record<any, any>,
  isModal: boolean
) => Promise<{
  msgOpts: MessageEditOptions | null
  context?: Record<any, any>
}>

type ButtonContext = {
  [K: string]: Handler<ButtonInteraction>
}

type SelectContext = {
  [K: string]: Handler<SelectMenuInteraction>
}

type Context = {
  button?: ButtonContext
  select?: SelectContext
  steps?: string[]
  modal?: Record<string, true>
  ephemeral?: Record<string, true>
  [K: string]: any
}

type CreateMachineParams = Parameters<typeof createMachine<Context, any, any>>

export type MachineConfig = CreateMachineParams[0] & { id: string }

function removeAllComponents(reply: Message) {
  wrapError(reply, async () => {
    await reply.edit({ components: [] }).catch(() => null)
  })
}

function decorateWithActions(
  states?: StatesConfig<any, any, any, BaseActionObject>
) {
  if (!states) return
  for (const state of Object.values(states)) {
    decorateWithActions(state.states)

    // we only add actions to leaf state, not compound state
    if (state.states) continue
    // decorate
    state.entry = ["record", "transition"]
  }
}

const target = {
  PREV_PAGE: -1,
  NEXT_PAGE: 1,
}

const PAGE_MAP = new Proxy<Record<string, number>>(target, {
  get(_, prop) {
    if (prop === "PREV_PAGE") return -1
    if (prop === "NEXT_PAGE") return 1
    return 0
  },
})

const builtinButtonHandlers: ButtonContext = {
  watchlist: (i) => composeWatchlist(i.user, 0),
  watchlistNft: (i) => composeWatchlist(i.user, 0, WatchListViewType.Nft),
  wallets: (i) => renderTrackingWallets(i.user),
  addWallet: (i) => handleWalletAddition(i),
  walletFollow: (i, _ev, ctx) =>
    followWallet(i, i.user, ctx.address, ctx.chain, ctx.alias),
  walletTrack: (i, _ev, ctx) =>
    trackWallet(i, i.user, ctx.address, ctx.chain, ctx.alias),
  walletCopy: (i, _ev, ctx) =>
    copyWallet(i, i.user, ctx.address, ctx.chain, ctx.alias),
  walletUntrack: (i, _ev, ctx) => untrackWallet(i, i.user, ctx.address),
  qrCodes: (i, ev, ctx) =>
    renderQr(i, i.member as GuildMember, Number(ctx.page ?? 0) + PAGE_MAP[ev]),
  airdrops: (i, ev, ctx) =>
    renderAirdrops(i.user.id, ctx.status, Number(ctx.page ?? 0) + PAGE_MAP[ev]),
}

const builtinSelectHandlers: SelectContext = {
  wallet: async (i) => {
    const [, type, address = ""] = i.values[0].split("_")
    const isMochi = type.startsWith("mochi")
    return {
      msgOpts: (
        await renderBalances(
          i.user.id,
          i,
          isMochi ? BalanceType.Offchain : BalanceType.Onchain,
          address
        )
      ).messageOptions,
    }
    let fetcherType = BalanceType.Offchain
    if (type.startsWith("mochi")) fetcherType = BalanceType.Offchain
    if (type.startsWith("wallet")) fetcherType = BalanceType.Onchain
    if (type.startsWith("dex")) fetcherType = BalanceType.Dex

    return (await renderBalances(i.user.id, i, fetcherType, address))
      .messageOptions
  },
  vault: async (i) => ({
    msgOpts: (await runGetVaultDetail(i.values[0].split("_")[1], i))
      .messageOptions,
  }),
  qr: (i) => viewQR(i),
  airdrop: (i) => airdropDetail(i),
}

export function paginationButtons(page: number, totalPage: number) {
  if (totalPage === 1) return []
  const actionRow = new MessageActionRow()
  if (page !== 0) {
    actionRow.addComponents(
      new MessageButton({
        style: "SECONDARY",
        emoji: getEmoji("LEFT_ARROW"),
        label: "\u200b",
        customId: "prev_page",
      })
    )
  }

  if (page !== totalPage - 1) {
    actionRow.addComponents(
      new MessageButton({
        style: "SECONDARY",
        emoji: getEmoji("RIGHT_ARROW"),
        label: "\u200b",
        customId: "next_page",
      })
    )
  }
  return [actionRow]
}

export function route(
  reply: Message,
  author: User,
  config: MachineConfig,
  options: CreateMachineParams[1] = {}
) {
  const cacheKey = `${author.id}-${config.id}`
  const {
    button,
    select,
    modal = {},
    ephemeral = {},
    ...userData
  } = (config.context ?? {}) as any
  routerCache.set(cacheKey, userData)

  // manually add action to each state and child states
  decorateWithActions(config.states)

  config.context ??= {
    ephemeral: {},
    modal: {},
  }

  const machine = createMachine(
    {
      ...config,
      context: {
        button: {
          ...builtinButtonHandlers,
          ...button,
        },
        select: {
          ...builtinSelectHandlers,
          ...select,
        },
        steps: [],
      },
      predictableActionArguments: true,
    },
    {
      ...options,
      guards: {
        ...options.guards,
      },
      actions: {
        record: (context, event) => {
          if (!event.interaction || event.dry) return
          if (event.interaction.isButton()) {
            context.steps?.push(
              `Click: button ${event.interaction.component.label} (id: ${event.interaction.customId})`
            )
            context.steps?.push(
              `Transition: ${event.prevState} -> ${event.state}`
            )
          } else if (event.interaction.isSelectMenu()) {
            const [value] = event.interaction.values
            const label =
              event.interaction.component.options.find(
                (opt: any) => opt.value === value
              )?.label ?? "___"
            context.steps?.push(`Select: option ${label} (value: ${value})`)
            context.steps?.push(
              `Transition: ${event.prevState} -> ${event.state}`
            )
          }
        },
        transition: (context, event) => {
          const { canBack = false, dry, interaction, state } = event
          if (!interaction || !state || dry || state === "steps") return
          let composer: Handler | undefined
          if (interaction.isButton()) {
            composer = context.button?.[state]
          } else {
            composer = context.select?.[state]
          }

          wrapError(interaction, async () => {
            if (!composer) return
            try {
              const oldContext = routerCache.get<any>(cacheKey) ?? {}
              const { context = {}, msgOpts } = await composer(
                interaction,
                event.type,
                oldContext,
                modal[event.type]
              )
              routerCache.set(cacheKey, { ...oldContext, ...context })

              if (!msgOpts) {
                interaction.message.delete().catch(() => null)
              } else {
                if (canBack) {
                  if (!msgOpts.components) msgOpts.components = []

                  msgOpts.components.push(
                    new MessageActionRow().addComponents(
                      new MessageButton()
                        .setLabel("Back")
                        .setStyle("SECONDARY")
                        .setCustomId("back")
                    )
                  )
                }

                interaction.editReply(msgOpts).catch(() => null)
              }
            } catch (e: any) {
              context.steps?.push(e.name)
              context.steps?.push(stack.clean(e.stack ?? ""))

              throw new Error(context.steps?.join("\n"))
            }
          })
        },
      },
    }
  )

  const machineService = interpret(machine).onDone(() =>
    removeAllComponents(reply)
  )
  machineService.start()

  reply
    .createMessageComponentCollector({
      filter: authorFilter(author.id),
      time: 300000,
      dispose: true,
    })
    .on("collect", (i) => {
      if (!i.isButton() && !i.isSelectMenu()) return
      wrapError(reply, async () => {
        let event = i.customId

        event = event.toUpperCase()

        const currentState = machineService.getSnapshot()
        const nextState = machineService.nextState({
          type: event,
          interaction: i,
          dry: true,
        })

        if (!i.deferred && !modal[event]) {
          if (ephemeral[event]) {
            await i.deferReply({ ephemeral: true }).catch(() => null)
          } else {
            await i.deferUpdate().catch(() => null)
          }
        }

        const can = currentState.can({ type: event, interaction: i, dry: true })
        if (can) {
          const prevState = currentState.toStrings().at(-1)?.split(".").at(-1)
          const state = nextState.toStrings().at(-1)?.split(".").at(-1) ?? ""

          machineService.send({
            type: event,
            interaction: i,
            prevState,
            state,
            canBack: nextState.can("BACK"),
          })
        }

        return Promise.resolve()
      })
    })
    .on("end", () => {
      machineService.stop()
      removeAllComponents(reply)
    })
}
