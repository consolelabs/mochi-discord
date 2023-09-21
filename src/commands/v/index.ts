import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { version } from "../../../package.json"

const slashCmd: SlashCommand = {
  name: "v",
  category: "Config",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("v")
      .setDescription("Check bot's version and running environment")
  },
  run: async function () {
    return {
      messageOptions: {
        content: `v${version} - ${process.env.NODE_ENV}`,
      },
    }
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
