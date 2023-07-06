import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Message } from "discord.js"
import { SlashCommand } from "types/common"
import { route } from "utils/router"
import { machineConfig, Option, render } from "../processor"

const options: Option[] = [
  {
    label: "Create a default DAO vault",
    labelDoing: "Creating vault...",
    labelDone: "Default vault created",
    value: "setup-dao/create-vault",
    handler: async () => await new Promise((r) => setTimeout(r, 5000)),
    required: true,
  },
  {
    label: "Create channels for proposal",
    labelDoing: "Creating proposal channel...",
    labelDone: "Proposal channels created",
    value: "setup-dao/proposal-channel",
    handler: async () => await new Promise((r) => setTimeout(r, 6300)),
    required: true,
  },
  {
    label: "Track snapshot",
    labelDoing: "Seting snapshot tracker...",
    labelDone: "Snapshot tracker created",
    value: "setup-dao/snapshot-tracker",
    handler: async () => await new Promise((r) => setTimeout(r, 3200)),
    required: true,
  },
]

const slashCmd: SlashCommand = {
  name: "dao",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("dao")
      .setDescription("Setup DAO configs")
  },
  onlyAdministrator: true,
  run: async function (i) {
    const { msgOpts, context } = await render(i, {
      id: "dao",
      options,
      currentOptions: [
        "setup-dao/create-vault",
        "setup-dao/proposal-channel",
        "setup-dao/snapshot-tracker",
      ],
    })
    const reply = (await i.editReply(msgOpts)) as Message

    route(reply, i, machineConfig("dao", context))
  },
  help: () => {
    return Promise.resolve({})
  },
  colorType: "Command",
  ephemeral: true,
}

export { slashCmd }
