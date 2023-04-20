import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import activitySlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const slashCmd: SlashCommand = {
  name: "activity",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("activity")
      .setDescription("User activity")
    return data
  },
  run: async function (i) {
    await activitySlash(i)
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Defi",
}

export default { slashCmd }
