import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"

import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

import { updateAlias } from "./processor"

const command: SlashCommand = {
  name: "set",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Set alias for a crypto wallet")
      .addStringOption((opt) =>
        opt
          .setName("wallet")
          .setDescription("Current alias or wallet address")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("alias")
          .setDescription("New alias for this wallet")
          .setRequired(true)
      )
  },
  run: async function (i: CommandInteraction) {
    const wallet = i.options.getString("wallet", true)
    const alias = i.options.getString("alias", true)

    const { msgOpts } = await updateAlias(i, i.user, wallet, alias)

    await i.editReply(msgOpts)
  },
  help: () => Promise.resolve({}),
  colorType: "Defi",
}

export default command
