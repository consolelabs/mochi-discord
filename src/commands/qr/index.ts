import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import qrSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const slashCmd: SlashCommand = {
  name: "qr",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("qr")
      .setDescription("User's qr codes")
    return data
  },
  run: qrSlash,
  help: () =>
    Promise.resolve({
      embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
    }),
  colorType: "Server",
}

export default { slashCmd }
