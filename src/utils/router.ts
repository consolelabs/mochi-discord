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
import { RunResult } from "types/common"
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

type Handler<P = any> = (
  params: P,
  ...rest: any[]
) => Promise<RunResult<MessageEditOptions>["messageOptions"]>

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
}

type CreateMachineParams = Parameters<typeof createMachine<Context, any, any>>

export type MachineConfig = CreateMachineParams[0]

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

const builtinButtonHandlers: ButtonContext = {
  watchlist: (i) => composeWatchlist(i.user, 0),
  watchlistNft: (i) => composeWatchlist(i.user, 0, WatchListViewType.Nft),
  wallets: (i) => renderTrackingWallets(i.user),
  addWallet: (i) => handleWalletAddition(i),
  qrCodes: (i, page) =>
    renderQr(i, i.member as GuildMember, page ? Number(page) : undefined),
  airdrops: (i, status, page) =>
    renderAirdrops(i.user.id, status, page ? Number(page) : undefined),
}

const builtinSelectHandlers: SelectContext = {
  wallet: async (i) => {
    const [, type, address = ""] = i.values[0].split("_")
    const isMochi = type.startsWith("mochi")
    return (
      await renderBalances(
        i.user.id,
        i,
        isMochi ? BalanceType.Offchain : BalanceType.Onchain,
        address
      )
    ).messageOptions
  },
  vault: (i) =>
    runGetVaultDetail(i.values[0].split("_")[1], i).then(
      (r) => r.messageOptions
    ),
  qr: (i) => viewQR(i),
  airdrop: (i) => airdropDetail(i),
}

export function paginationButtons(id: string, page: number, totalPage: number) {
  if (totalPage === 1) return []
  const actionRow = new MessageActionRow()
  if (page !== 0) {
    actionRow.addComponents(
      new MessageButton({
        style: "SECONDARY",
        emoji: getEmoji("LEFT_ARROW"),
        label: "\u200b",
        customId: [id, page - 1, totalPage].join("/"),
      })
    )
  }

  if (page !== totalPage - 1) {
    actionRow.addComponents(
      new MessageButton({
        style: "SECONDARY",
        emoji: getEmoji("RIGHT_ARROW"),
        label: "\u200b",
        customId: [id, page + 1, totalPage].join("/"),
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
  // manually add action to each state and child states
  decorateWithActions(config.states)

  config.context ??= {}

  const machine = createMachine(
    {
      ...config,
      context: {
        button: {
          ...builtinButtonHandlers,
          ...("button" in config.context ? config.context.button : {}),
        },
        select: {
          ...builtinSelectHandlers,
          ...("select" in config.context ? config.context.select : {}),
        },
        steps: [],
      },
      predictableActionArguments: true,
    },
    {
      ...options,
      guards: {
        ...options.guards,
        isWallet: (_ctx, ev) => {
          return ev.interaction?.values[0].startsWith("wallet")
        },
        isVault: (_ctx, ev) => {
          return ev.interaction?.values[0].startsWith("vault")
        },
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
          const {
            reaction,
            canBack = false,
            dry,
            interaction,
            state,
            args = [],
          } = event
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
              const msgOpts = await composer(interaction, ...args)
              await reaction?.remove()

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
        if (!i.deferred) {
          await i.deferUpdate().catch(() => null)
        }

        const splitted = i.customId.split("/")
        let [event] = splitted
        const [, ...args] = splitted

        event = event.toUpperCase()

        const currentState = machineService.getSnapshot()
        const nextState = machineService.nextState({
          type: event,
          interaction: i,
          dry: true,
        })
        const can = currentState.can({ type: event, interaction: i, dry: true })
        if (can) {
          const prevState = currentState.toStrings().at(-1)?.split(".").at(-1)
          const state = nextState.toStrings().at(-1)?.split(".").at(-1)

          const reaction = await (i.message as Message)
            .react(getEmoji("ANIMATED_MOCHI_SPIN", true))
            .catch(() => null)

          machineService.send({
            type: event,
            interaction: i,
            prevState,
            state,
            canBack: nextState.can("BACK"),
            reaction,
            args,
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
