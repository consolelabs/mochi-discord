import { SlashCommandBuilder } from "@discordjs/builders"
import api from "api"
import { SlashCommand } from "types/common"
import { fetchEmojis } from "../.."
import { fetchCommandPermissions } from "utils/commands"

const slashCmd: SlashCommand = {
  name: "sync",
  category: "Config",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("sync")
      .setDescription("Sync bot's metadata (internal use)")
  },
  run: async function () {
    api.init()
    fetchEmojis()
    fetchCommandPermissions()
    return {
      messageOptions: {
        content: "synced",
      },
    }
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
