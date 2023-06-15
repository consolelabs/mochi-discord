import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"

const slashCmd: SlashCommand = {
  name: "email",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("email")
      .setDescription("Update email")
  },
  run: async (i) => {},
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
