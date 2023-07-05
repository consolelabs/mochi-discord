import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import inboxSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const slashCmd: SlashCommand = {
  name: "inbox",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("inbox")
      .setDescription("User activity through inbox")
    return data
  },
  run: async function (i) {
    return await inboxSlash(i)
  },
  help: () =>
    Promise.resolve({
      embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
    }),
  colorType: "Defi",
}

export default { slashCmd }
