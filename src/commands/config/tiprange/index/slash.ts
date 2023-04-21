import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import run from "./processor"

const slashCmd: SlashCommand = {
  name: "tiprange",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("tiprange")
      .setDescription("Set the amount range of USD that can be tipped")
      .addNumberOption((opt) =>
        opt
          .setName("minrain")
          .setDescription("enter minimum USD amount that can be tipped")
          .setRequired(true)
      )
      .addNumberOption((opt) =>
        opt
          .setName("maxtipped")
          .setDescription("enter maximum USD amount that can be tipped")
          .setRequired(true)
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
