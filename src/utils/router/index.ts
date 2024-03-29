/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  SelectMenuInteraction,
} from "discord.js"
import {
  BaseActionObject,
  createMachine,
  interpret,
  StateNodesConfig,
  StatesConfig,
} from "xstate"
import { authorFilter, getEmoji } from "../common"
import { wrapError } from "../wrap-error"
import CacheManager from "cache/node-cache"
import { Handler, MachineConfig, MachineOptions } from "./types"
import { merge } from "lodash"
import { getRandomFact } from "cache/tip-fact-cache"
import { PROD } from "env"
import { profilingAsyncStore } from "utils/async-storages"

export type { MachineConfig }

const routerCache = CacheManager.init({
  pool: "router-store",
  ttl: 0,
  checkperiod: 0,
})

function decorateWithActions(
  states?: StatesConfig<any, any, any, BaseActionObject>,
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

function aggregateContext(states: StateNodesConfig<any, any, any>) {
  if (!states) return {}
  let context = {}

  for (const s of Object.values(states)) {
    context = merge(context, s.context, aggregateContext(s.states))
  }

  return context
}

export enum RouterSpecialAction {
  PREV_PAGE = "PREV_PAGE",
  NEXT_PAGE = "NEXT_PAGE",
  BACK = "BACK",
}

const target = {
  PREV_PAGE: -1,
  NEXT_PAGE: 1,
}

const PAGE_MAP = new Proxy<Record<string, number>>(target, {
  get(_, prop) {
    if (prop === RouterSpecialAction.PREV_PAGE) return -1
    if (prop === RouterSpecialAction.NEXT_PAGE) return 1
    return 0
  },
})

export function paginationButtons(page: number, totalPage: number) {
  if (totalPage <= 1) return []
  const actionRow = new MessageActionRow()
  if (page !== 0) {
    actionRow.addComponents(
      new MessageButton({
        style: "SECONDARY",
        emoji: getEmoji("LEFT_ARROW"),
        label: "\u200b",
        customId: "prev_page",
      }),
    )
  }

  if (page !== totalPage - 1) {
    actionRow.addComponents(
      new MessageButton({
        style: "SECONDARY",
        emoji: getEmoji("RIGHT_ARROW"),
        label: "\u200b",
        customId: "next_page",
      }),
    )
  }
  return [actionRow]
}

export function route(
  reply: Message,
  interaction: CommandInteraction | ButtonInteraction | SelectMenuInteraction,
  config: MachineConfig,
  options: MachineOptions = {},
) {
  // add a random fact
  if (PROD) {
    reply
      .edit({
        content: getRandomFact(),
      })
      .catch(() => null)
  }

  const author = interaction.user
  const cacheKey = `${author.id}-${config.id}`
  const lastInteractionCacheKey = `${author.id}-${config.id}-last-interaction`
  let modal: Record<string, boolean> = {}
  let ephemeral: Record<string, boolean> = {}

  const { button, select } = (config.context ?? {}) as any

  // manually add action to each state and child states
  decorateWithActions(config.states)

  config.context ??= {
    ephemeral: {},
    modal: {},
  }

  let machine = createMachine(
    {
      ...config,
      context: {
        ...config.context,
        button,
        select,
        steps: [],
      },
      predictableActionArguments: true,
    },
    {
      ...options,
      guards: options.guards,
      actions: {
        ...options.actions,
        record: (context, event) => {
          if (!event.interaction || event.dry) return
          if (event.interaction.isButton()) {
            context.steps?.push(
              {
                type: "button",
                data: {
                  label: event.interaction.component.label,
                  id: event.interaction.customId,
                },
              },
              // `Click button ${event.interaction.component.label} (id: ${event.interaction.customId})`,
            )
            context.steps?.push({
              type: "view",
              data: {
                old: event.prevState,
                new: event.state,
              },
            })
          } else if (event.interaction.isSelectMenu()) {
            const [value] = event.interaction.values
            const label =
              event.interaction.component.options.find(
                (opt: any) => opt.value === value,
              )?.label ?? "___"
            context.steps?.push({
              type: "select",
              data: {
                label,
                value,
                id: event.interaction.customId,
              },
            })
            context.steps?.push({
              type: "view",
              data: {
                old: event.prevState,
                new: event.state,
              },
            })
          }
        },
        transition: (context, event) => {
          const {
            canBack = false,
            dry,
            interaction,
            state,
            context: oldContext,
            reply,
          } = event
          if (!interaction || !state || dry || state === "steps") return
          let composer: Handler | undefined
          if (interaction.isButton()) {
            composer = context.button?.[state]
          } else {
            composer = context.select?.[state]
          }

          wrapError(reply, async () => {
            if (!composer) return
            try {
              // handle pagination for user
              if (
                [
                  RouterSpecialAction.PREV_PAGE,
                  RouterSpecialAction.NEXT_PAGE,
                ].includes(event.type) &&
                typeof oldContext.page === "number"
              ) {
                oldContext.page += PAGE_MAP[event.type]
                oldContext.page = Math.max(oldContext.page, 0)
              }

              // profiling
              await profilingAsyncStore.run(performance.now(), async () => {
                if (!composer) return
                // run handler
                const result = await composer(
                  interaction,
                  event.type,
                  oldContext,
                  modal[event.type],
                )
                if (!result) return
                const { context = {}, msgOpts } = result
                const newContext = {
                  ...oldContext,
                  ...context,
                }

                routerCache.set(cacheKey, newContext)

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
                          .setCustomId("back"),
                      ),
                    )
                  }

                  interaction.message.edit(msgOpts).catch(() => {
                    interaction.editReply(msgOpts).catch(() => null)
                  })
                }
              })
            } catch (e: any) {
              const firstComponent = context.steps?.find(
                (s) => s.type === "select" || s.type === "button",
              )

              if (firstComponent) {
                const { type, data } = firstComponent
                const { id } = data

                e.name = `${type} ${id} ⎯  ${e.name}: ${e.message}`
              }

              throw e
            }
          })
        },
      },
    },
  )

  const aggregatedContext = aggregateContext(machine.states)
  machine = machine.withContext(merge(machine.context, aggregatedContext))

  modal = machine.context.modal ?? {}
  ephemeral = machine.context.ephemeral ?? {}

  const {
    button: b,
    select: s,
    steps: _s,
    modal: m,
    ephemeral: e,
    ...userData
  } = machine.context
  routerCache.set(cacheKey, userData)

  const machineService = interpret(machine)
  machineService.start()

  routerCache.set(lastInteractionCacheKey, interaction)
  reply
    .createMessageComponentCollector({
      filter: authorFilter(author.id),
      time: 300000,
    })
    .on("collect", (i) => {
      if (!i.isButton() && !i.isSelectMenu()) return
      wrapError(reply, async () => {
        routerCache.set(lastInteractionCacheKey, i)
        let event = i.customId

        event = event.toUpperCase()

        const context = routerCache.get<any>(cacheKey) ?? {}
        const currentState = machineService.getSnapshot()
        const nextState = machineService.nextState({
          type: event,
          interaction: i,
          dry: true,
          context,
          reply,
        })

        if (!i.deferred && !modal[event]) {
          if (ephemeral[event]) {
            await i.deferReply({ ephemeral: true }).catch(() => null)
          } else {
            await i.deferUpdate().catch(() => null)
          }
        }

        const can = currentState.can({
          type: event,
          interaction: i,
          context,
          dry: true,
          reply,
        })
        if (can) {
          const prevState = currentState.toStrings().at(-1)?.split(".").at(-1)
          const state = nextState.toStrings().at(-1)?.split(".").at(-1) ?? ""

          machineService.send({
            type: event,
            interaction: i,
            prevState,
            state,
            canBack: nextState.can(RouterSpecialAction.BACK),
            context,
            reply,
          })
        }

        return Promise.resolve()
      })
    })
    .on("end", () => {
      machineService.stop()
      routerCache.del(cacheKey)

      const lastInteraction = routerCache.get<
        ButtonInteraction | SelectMenuInteraction
      >(lastInteractionCacheKey)
      lastInteraction?.editReply({ components: [] }).catch(() => null)

      routerCache.del(lastInteractionCacheKey)
    })
}
