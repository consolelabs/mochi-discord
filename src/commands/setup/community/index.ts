import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Message } from "discord.js"
import { SlashCommand } from "types/common"
import { route } from "utils/router"
import { machineConfig, Option, render } from "../processor"

const options: Option[] = [
  {
    label: "Use MOCHI as the default token",
    labelDoing: "Getting token information...",
    labelDone: "MOCHI token setup success",
    value: "setup-community/default-token",
    handler: async () => await new Promise((r) => setTimeout(r, 3000)),
    required: true,
  },
  {
    label: "Set tiprange for your server",
    labelDoing: "Seting min max amount...",
    labelDone: "Tiprange configured",
    value: "setup-community/config-tiprange",
    handler: async () => await new Promise((r) => setTimeout(r, 6300)),
    required: true,
  },
]

const slashCmd: SlashCommand = {
  name: "community",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("community")
      .setDescription("Setup community configs")
      .addStringOption((opt) =>
        opt
          .setName("chain")
          .setDescription("the chain of your preferred token")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("address")
          .setDescription("the contract address of your preferred token")
          .setRequired(true)
      )
  },
  onlyAdministrator: true,
  run: async function (i) {
    const { msgOpts, context } = await render(i, {
      id: "community",
      options,
      currentOptions: [
        "setup-community/default-token",
        "setup-community/config-tiprange",
      ],
    })
    const reply = (await i.editReply(msgOpts)) as Message

    route(reply, i, machineConfig("community", context))
  },
  help: () => {
    return Promise.resolve({})
  },
  colorType: "Command",
  ephemeral: true,
}

export { slashCmd }
