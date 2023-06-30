import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { render, View } from "./index/processor"

const slashCmd: SlashCommand = {
  name: "roles",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("roles")
      .setDescription("list all role configs in your server")

    return data
  },
  run: async function (i) {
    const { msgOpts: messageOptions } = await render(i, View.DefaultRole)

    return {
      messageOptions,
    }
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
