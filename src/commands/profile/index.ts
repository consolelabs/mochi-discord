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
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}profile\n${PREFIX}profile @Mochi Bot\n${PREFIX}profile John`,
          usage: `${PREFIX}profile\n${PREFIX}profile <user>`,
          description:
            "Display your and other users' profiles along with NFT collections",
          footer: [`Type ${PREFIX}profile to check your profile`],
          document: PROFILE_GITBOOK,
        }),
      ],
    }
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
      .addStringOption((option) =>
        option
          .setName("user")
          .setDescription("user's nickname or mention. Example: @John")
          .setRequired(false)
      )
    return data
  },
  run: profileSlash,
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
