import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { getEmoji } from "utils/common"
import { MachineConfig } from "utils/router"

export type Option = {
  label: string
  labelDoing: string
  labelDone: string
  value: string
  handler: () => Promise<any>
  steps?: any[]
  required?: boolean
}

type Context = {
  id: string
  options: any[]
  currentOptions: string[]
  allDone?: boolean
}

const done: any = {}
const running: any = {}

export const machineConfig: (id: string, ctx: any) => MachineConfig = (
  id,
  ctx
) => ({
  id: `setup-1-click-${id}`,
  initial: "ask",
  context: {
    select: {
      ask: (i, _ev, ctx) => render(i, ctx as any),
    },
    button: {
      execute: (i, _ev, ctx) => execute(i, ctx as any),
    },
    ...ctx,
  },
  states: {
    ask: {
      on: {
        SELECT_OPTION: "ask",
        CONFIRM: "execute",
      },
    },
    execute: {},
  },
})

async function execute(i: ButtonInteraction, ctx: Context) {
  const opts = ctx.options.slice()

  if (!ctx.allDone) {
    opts.forEach((opt) => {
      if (done[ctx.id][opt.value]) return
      if (running[ctx.id].length === opts.length) {
        Promise.all(running[ctx.id]).then(() =>
          execute(i, { ...ctx, allDone: true })
        )
        return
      }
      let promise
      if (opt.steps) {
        promise = Promise.all(
          opt.steps.map(async (s: any) => {
            return await s.handler().then(() => {
              done[ctx.id][s.value] = true
              execute(i, ctx)
            })
          })
        ).then(() => {
          done[ctx.id][opt.value] = true
          execute(i, ctx)
        })
      } else {
        promise = opt.handler().then(() => {
          done[ctx.id][opt.value] = true
          execute(i, ctx)
        })
      }
      running[ctx.id].push(promise)
    })
  }

  i.editReply({
    content: [
      ...opts.map((opt) => {
        if (!ctx.currentOptions.includes(opt.value)) {
          return `${getEmoji("LINE")} (skipped) ${opt.label}`
        }

        return `${
          done[ctx.id][opt.value]
            ? getEmoji("CHECK")
            : "<a:loading:647604616858566656>"
        } ${done[ctx.id][opt.value] ? opt.labelDone : opt.labelDoing}${
          opt.steps
            ? "\n" +
              opt.steps
                .map((s: any) => {
                  return `${getEmoji("BLANK")}${
                    done[ctx.id][opt.value] || done[ctx.id][s.value]
                      ? getEmoji("CHECK")
                      : "<a:loading:647604616858566656>"
                  } ${
                    done[ctx.id][opt.value] || done[ctx.id][s.value]
                      ? s.labelDone
                      : s.labelDoing
                  }`
                })
                .join("\n")
            : ""
        }`
      }),
      ...(ctx.allDone ? [getEmoji("BLANK"), "All steps done."] : []),
    ].join("\n"),
    components: [],
  })

  return null
}

export async function render(
  i: SelectMenuInteraction | CommandInteraction,
  ctx: Context
) {
  done[ctx.id] = {}
  running[ctx.id] = []
  let optVal = ""
  if (i.isSelectMenu()) {
    optVal = i.values.at(0) as string
  }
  let newOptions = [...ctx.currentOptions]

  if (ctx.currentOptions.includes(optVal)) {
    newOptions = ctx.currentOptions.filter((opt: any) => opt !== optVal)
  } else {
    newOptions.push(optVal)
  }

  const nonRequiredOptions = ctx.options.filter((opt) => !opt.required)

  return {
    context: {
      ...ctx,
      currentOptions: newOptions,
    },
    msgOpts: {
      content: ctx.options
        .map(
          (opt) =>
            `${
              newOptions.includes(opt.value)
                ? getEmoji("CHECK")
                : getEmoji("LINE")
            } ${opt.label}${
              opt.steps && newOptions.includes(opt.value)
                ? "\n" +
                  opt.steps
                    .map((s: any) => {
                      return `${getEmoji("BLANK")}${getEmoji("CHECK")} ${
                        s.label
                      }`
                    })
                    .join("\n")
                : ""
            }`
        )
        .join("\n"),
      components: [
        ...(nonRequiredOptions.length
          ? [
              new MessageActionRow().addComponents(
                new MessageSelectMenu({
                  placeholder: "Select options",
                  options: nonRequiredOptions,
                  customId: "select_option",
                })
              ),
            ]
          : []),
        new MessageActionRow().addComponents(
          new MessageButton({
            customId: "confirm",
            style: "SECONDARY",
            label: "Run",
            disabled: !newOptions.length,
          })
        ),
      ],
    },
  }
}
