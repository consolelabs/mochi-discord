import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { render } from "./slash/processor"

const slashCmd: SlashCommand = {
  name: "user-setting",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("user-setting")
      .setDescription("View")
    return data
  },
  run: async () => {
    const { msgOpts } = await render()

    return { messageOptions: msgOpts }
  },
  help: () => Promise.resolve({}),
  colorType: "Defi",
}

export default { slashCmd }
