import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX, PROFILE_GITBOOK } from "utils/constants"
import activity from "./index/text"
import activitySlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const textCmd: Command = {
  id: "activity",
  command: "activity",
  brief: "User Activity",
  category: "Defi",
  run: async function (msg) {
    return await activity(msg)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}activity`,
          usage: `${PREFIX}activity`,
          description: "Display daily activities of user",
          footer: [`Type ${PREFIX}activity to check activity of user`],
          document: PROFILE_GITBOOK,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Defi",
}

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
    return await activitySlash(i)
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
