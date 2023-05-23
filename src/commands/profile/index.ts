import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX, PROFILE_GITBOOK } from "utils/constants"
import profile from "./index/text"
import profileSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const textCmd: Command = {
  id: "profile",
  command: "profile",
  brief: "User's profile",
  category: "Profile",
  run: profile,
  getHelpMessage: (msg) => {
    return Promise.resolve({
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}profile`,
          usage: `${PREFIX}profile`,
          description: "Display your profile",
          footer: [`Type ${PREFIX}profile to check your profile`],
          document: PROFILE_GITBOOK,
        }),
      ],
    })
  },
  canRunWithoutAction: true,
  colorType: "Profile",
}

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
          .setRequired(false)
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

export default { textCmd, slashCmd }
