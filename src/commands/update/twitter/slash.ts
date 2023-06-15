import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"

const slashCmd: SlashCommand = {
  name: "twitter",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("twitter")
      .setDescription("Update Twitter")
  },
  run: async (i) => {},
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
