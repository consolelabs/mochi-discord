import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { getEmoji } from "utils/common"

const slashCmd: SlashCommand = {
  name: "telegram",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("telegram")
      .setDescription("Update Telegram")
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
