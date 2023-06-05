import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
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
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("chain")
          .setDescription("the chain of that address")
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName("alias")
          .setDescription("something easier for you to remember")
          .setRequired(false)
      )
  },
  run: async function (i: CommandInteraction) {
    const address = i.options.getString("address", true)
    const chain = i.options.getString("chain", false) ?? "eth"
    const alias = i.options.getString("alias", false) ?? ""

    return {
      messageOptions: await copyWallet(i, i.user, address, chain, alias),
    }
  },
  help: () => Promise.resolve({}),
  colorType: "Defi",
}

export default command
