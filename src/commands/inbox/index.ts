import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX, PROFILE_GITBOOK } from "utils/constants"
import inbox from "./index/text"
import inboxSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const textCmd: Command = {
  id: "inbox",
  command: "inbox",
  brief: "User Activity through inbox",
  category: "Defi",
  run: async function (msg) {
    return await inbox(msg)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}inbox`,
          usage: `${PREFIX}inbox`,
          description: "Display daily activities of user through inbox",
          footer: [`Type ${PREFIX}activity to check inbox of user`],
          document: PROFILE_GITBOOK,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Defi",
}

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
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
