import { machineConfig } from "commands/wallet/common/tracking"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { route } from "utils/router"

import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

import { followWallet } from "./processor"

const command: SlashCommand = {
  name: "follow",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("follow")
      .setDescription("Follow any wallet")
      .addStringOption((opt) =>
        opt
          .setName("address")
          .setDescription("the address to follow")
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

    const { msgOpts, context } = await followWallet(i, i.user, address, alias)
    const reply = await i.editReply(msgOpts)

    route(reply as Message, i, machineConfig("walletFollow", context))
  },
  help: () => Promise.resolve({}),
  colorType: "Defi",
}

export default command
