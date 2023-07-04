import { SlashCommandBuilder } from "@discordjs/builders"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { SlashCommand } from "types/common"
import { getEmoji } from "utils/common"
import { MachineConfig, route } from "utils/router"

const machineConfig: MachineConfig = {
  id: "setup-1-click",
  initial: "ask",
  context: {
    select: {
      ask: (i, _ev, ctx) => rerender(i, ctx.options),
    },
    button: {
      execute: (i, _ev, ctx) => execute(i, ctx.options),
    },
    options: [],
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
}

const options = [
  {
    label: "Setup verification channel",
    value: "verify-channel",
    handler: async () => await new Promise((r) => setTimeout(r, 2000)),
  },
  {
    label: "Create roles",
    value: "create-roles",
    handler: async () => await new Promise((r) => setTimeout(r, 3000)),
  },
  {
    label: "Create a first DAO vault",
    value: "create-dao-vault",
    handler: async () => await new Promise((r) => setTimeout(r, 4200)),
  },
]

const done: any = {}
const running: any = []

async function execute(
  i: ButtonInteraction,
  currentOptions: any,
  allDone = false
) {
  const opts = options.filter((opt) => currentOptions.includes(opt.value))

  opts.forEach((opt) => {
    if (done[opt.value]) return
    if (running.length === opts.length) {
      Promise.all(running).then(() => execute(i, currentOptions, true))
      return
    }
    const promise = opt.handler().then(() => {
      done[opt.value] = true
      execute(i, currentOptions)
    })

    running.push(promise)
  })

  i.editReply({
    content: [
      ...opts.map(
        (opt) =>
          `${
            done[opt.value]
              ? getEmoji("CHECK")
              : "<a:loading:647604616858566656>"
          } ${opt.label}`
      ),
      ...(allDone
        ? ["All initialization finished, your server is ready."]
        : []),
    ].join("\n"),
    components: [],
  })

  return null
}

async function rerender(i: SelectMenuInteraction, currentOptions: any) {
  const optVal = i.values.at(0)
  let newOptions = [...currentOptions]

  if (currentOptions.includes(optVal)) {
    newOptions = currentOptions.filter((opt: any) => opt !== optVal)
  } else {
    newOptions.push(optVal)
  }

  return {
    context: {
      options: newOptions,
    },
    msgOpts: {
      content: options
        .map(
          (opt) =>
            `${
              newOptions.includes(opt.value)
                ? getEmoji("CHECK")
                : getEmoji("LINE")
            } ${opt.label}`
        )
        .join("\n"),
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu({
            placeholder: "Select options",
            options,
            customId: "select_option",
          })
        ),
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

const slashCmd: SlashCommand = {
  name: "setup",
  category: "Config",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("setup")
      .setDescription("Setup your server")
  },
  onlyAdministrator: true,
  run: async function (i) {
    const reply = (await i.editReply({
      content: options
        .map((opt) => `${getEmoji("LINE")} ${opt.label}`)
        .join("\n"),
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu({
            placeholder: "Select options",
            options,
            customId: "select_option",
          })
        ),
        new MessageActionRow().addComponents(
          new MessageButton({
            customId: "confirm",
            style: "SECONDARY",
            label: "Run",
          })
        ),
      ],
    })) as Message

    route(reply, i, machineConfig)
  },
  help: () => {
    return Promise.resolve({})
  },
  colorType: "Command",
  ephemeral: true,
}

export default { slashCmd }
