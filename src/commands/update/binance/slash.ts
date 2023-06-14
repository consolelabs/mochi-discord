import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"

const slashCmd: SlashCommand = {
  name: "binance",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("binance")
      .setDescription("Update binance key")
  },
  run: async (i) => {},
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
