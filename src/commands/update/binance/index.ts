import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import update from "./index/slash"

const slashCmd: SlashCommand = {
  name: "binance",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("binance")
      .setDescription("Update binance key")
  },
  run: update,
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
