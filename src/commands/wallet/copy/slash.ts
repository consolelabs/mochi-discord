import { machineConfig } from "commands/wallet/common/tracking"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { route } from "utils/router"

import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

import { copyWallet } from "./processor"

const command: SlashCommand = {
  name: "copy",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("copy")
      .setDescription("copy any wallet")
      .addStringOption((opt) =>
        opt
          .setName("address")
          .setDescription("the address to copy")
          .setRequired(true),
      )
      .addStringOption((opt) =>
        opt
          .setName("alias")
          .setDescription("something easier for you to remember")
          .setRequired(false),
      )
  },
  run: async function (i: CommandInteraction) {
    const address = i.options.getString("address", true)
    const alias = i.options.getString("alias", false) ?? ""

    const { msgOpts, context } = await copyWallet(i, i.user, address, alias)
    const reply = await i.editReply(msgOpts)

    route(reply as Message, i, machineConfig("walletCopy", context))
  },
  help: () => Promise.resolve({}),
  colorType: "Defi",
}

export default command
