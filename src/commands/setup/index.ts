import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"

const slashCmd: SlashCommand = {
  name: "setup",
  category: "Config",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("setup")
      .setDescription("Setup your server")
  },
  onlyAdministrator: true,
  run: async function () {
    return {
      messageOptions: {
        content: "WIP",
      },
    }
  },
  help: () => {
    return Promise.resolve({})
  },
  colorType: "Command",
  ephemeral: true,
}

export default { slashCmd }
