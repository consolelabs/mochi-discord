import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import run from "./processor"

const slashCmd: SlashCommand = {
  name: "maxtipped",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("maxtipped")
      .setDescription("Set maximum USD amount that can be tipped")
      .addNumberOption((opt) =>
        opt
          .setName("value")
          .setDescription("enter maximum USD amount that can be tipped")
          .setRequired(true),
      )

    return data
  },
  run,
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default slashCmd
