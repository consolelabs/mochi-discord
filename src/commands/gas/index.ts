import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import gasSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const slashCmd: SlashCommand = {
  name: "gas",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("gas")
      .setDescription("Gas Tracker")
      .addStringOption((option) =>
        option
          .setName("chain")
          .setDescription("gas price of many networks")
          .setRequired(false)
      )
    return data
  },
  run: gasSlash,
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Defi",
}

export default { slashCmd }
