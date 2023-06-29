import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"

import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

import { updateAlias } from "../set/processor"

const command: SlashCommand = {
  name: "remove",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove wallet's alias")
      .addStringOption((opt) =>
        opt
          .setName("wallet")
          .setDescription("Current alias or wallet address")
          .setRequired(true)
      )
  },
  run: async function (i: CommandInteraction) {
    const wallet = i.options.getString("wallet", true)

    const { msgOpts } = await updateAlias(i, i.user, wallet)

    await i.editReply(msgOpts)
  },
  help: () => Promise.resolve({}),
  colorType: "Defi",
}

export default command
