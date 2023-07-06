import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Message } from "discord.js"
import { SlashCommand } from "types/common"
import { route } from "utils/router"
import { machineConfig, Option, render } from "../processor"

const options: Option[] = [
  {
    label: "Create gm quest",
    labelDoing: "Gm quest: running steps...",
    labelDone: "Gm quest configured success",
    steps: [
      {
        label: "Create channel",
        labelDoing: "Creating gm channel...",
        labelDone: "Gm channel created",
        handler: async () => await new Promise((r) => setTimeout(r, 3000)),
      },
      {
        label: "Set gm quest reset time",
        labelDoing: "Setting gm quest reset time...",
        labelDone: "Gm quest now repeats daily",
        handler: async () => await new Promise((r) => setTimeout(r, 3300)),
      },
      {
        label: "Created gm streak bonus",
        labelDoing: "Setting up bonus limits...",
        labelDone: "Gm streak created",
        handler: async () => await new Promise((r) => setTimeout(r, 4400)),
      },
    ],
    value: "setup-quest/gm-quest",
    handler: async () => {
      return
    },
    required: true,
  },
  {
    label: "Create invite quest",
    labelDoing: "Invite quest: running steps...",
    labelDone: "Invite quest configured success",
    steps: [
      {
        label: "Set invite tracker",
        labelDoing: "Invite tracker initializing...",
        labelDone: "Invite trakcer initialized",
        handler: async () => await new Promise((r) => setTimeout(r, 2200)),
      },
      {
        label: "Created invite streak bonus",
        labelDoing: "Setting up bonus limits...",
        labelDone: "Invite streak created",
        handler: async () => await new Promise((r) => setTimeout(r, 2600)),
      },
    ],
    value: "setup-quest/invite-quest",
    handler: async () => {
      return
    },
    required: true,
  },
]

const slashCmd: SlashCommand = {
  name: "quest",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("quest")
      .setDescription("Setup quest configs")
  },
  onlyAdministrator: true,
  run: async function (i) {
    const { msgOpts, context } = await render(i, {
      id: "quest",
      options,
      currentOptions: [
        "setup-quest/default-token",
        "setup-quest/config-tiprange",
      ],
    })
    const reply = (await i.editReply(msgOpts)) as Message

    route(reply, i, machineConfig("quest", context))
  },
  help: () => {
    return Promise.resolve({})
  },
  colorType: "Command",
  ephemeral: true,
}

export { slashCmd }
