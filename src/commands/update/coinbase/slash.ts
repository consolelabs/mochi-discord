import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"

const slashCmd: SlashCommand = {
  name: "coinbase",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("coinbase")
      .setDescription("Update coinbase key")
  },
  run: async (i) => {},
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
