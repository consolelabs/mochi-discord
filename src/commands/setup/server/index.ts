import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Message } from "discord.js"
import { SlashCommand } from "types/common"
import { route } from "utils/router"
import { Option, render, machineConfig } from "../processor"

const options: Option[] = [
  {
    label: "Create channels",
    labelDoing: "Creating channels...",
    labelDone: "Channels created",
    value: "setup-server/create-channels",
    steps: [
      {
        label: "Lounge channel (where your user will hangout the most)",
        labelDoing: "Creating lounge channel...",
        labelDone: "Lounge channel created",
        value: "setup-server/channel-general",
        handler: async () => await new Promise((r) => setTimeout(r, 3000)),
      },
      {
        label: "International channels",
        labelDoing: "Creating international channels...",
        labelDone: "International channel created",
        value: "setup-server/channel-international",
        handler: async () => await new Promise((r) => setTimeout(r, 4000)),
      },
      {
        label: "Topic channels",
        labelDoing: "Creating topic channels...",
        labelDone: "Topic channels created",
        value: "setup-server/channel-topic",
        handler: async () => await new Promise((r) => setTimeout(r, 4000)),
      },
    ],
    handler: async () => {
      return
    },
    required: true,
  },
  {
    label: "Create roles",
    labelDoing: "Creating roles for members and moderators...",
    labelDone: "Roles created",
    value: "setup-server/create-roles",
    handler: async () => await new Promise((r) => setTimeout(r, 3000)),
    required: true,
  },
  {
    label: "Setup verification channel",
    labelDoing: "Creating verfication channel & message...",
    labelDone: "Verfication flow setup",
    value: "setup-server/verify-channel",
    handler: async () => await new Promise((r) => setTimeout(r, 2000)),
    required: true,
  },
]

const slashCmd: SlashCommand = {
  name: "server",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("server")
      .setDescription("Setup your server")
  },
  onlyAdministrator: true,
  run: async function (i) {
    const { msgOpts, context } = await render(i, {
      id: "server",
      options,
      currentOptions: [
        "setup-server/create-channels",
        "setup-server/verify-channel",
        "setup-server/create-roles",
      ],
    })
    const reply = (await i.editReply(msgOpts)) as Message

    route(reply, i, machineConfig("server", context))
  },
  help: () => {
    return Promise.resolve({})
  },
  colorType: "Command",
  ephemeral: true,
}

export { slashCmd }
