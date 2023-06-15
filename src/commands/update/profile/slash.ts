import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"

const slashCmd: SlashCommand = {
  name: "profile",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("profile")
      .setDescription("Update profile")
  },
  run: async (i) => {},
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
