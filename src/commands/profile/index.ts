import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import profileSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const slashCmd: SlashCommand = {
  name: "profile",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("profile")
      .setDescription("User's profile")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("user's nickname or mention. Example: @John")
          .setRequired(false),
      )
    return data
  },
  run: profileSlash,
  help: () =>
    Promise.resolve({
      embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
    }),
  colorType: "Server",
}

export default { slashCmd }
