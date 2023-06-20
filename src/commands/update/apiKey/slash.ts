import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { getEmoji } from "utils/common"

const slashCmd: SlashCommand = {
  name: "apikey",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("apikey")
      .setDescription("Update apikey")
  },
  run: async (i) => {
    return {
      messageOptions: {
        content: getEmoji("SOON"),
      },
    }
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
