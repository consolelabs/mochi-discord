import { SlashCommandBuilder } from "@discordjs/builders"
import { Command, SlashCommand } from "types/common"
import { FEEDBACK_GITBOOK, PREFIX, SLASH_PREFIX } from "utils/constants"
import feedback from "./index/text"
import feedbackSlash from "./index/slash"
import { composeEmbedMessage } from "ui/discord/embed"

const textCmd: Command = {
  id: "feedback",
  command: "feedback",
  brief: "Feedback",
  category: "Community",
  run: feedback,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}feedback <${PREFIX}command> <description>`,
        examples: `${PREFIX}feedback i like it\n${PREFIX}feedback $gm UI can be better`,
        footer: [`Type ${PREFIX}help for more actions!`],
        description:
          "Give feedback for the Mochi team about a specific command or in general",
        document: FEEDBACK_GITBOOK,
      }),
    ],
  }),
  colorType: "Command",
  canRunWithoutAction: true,

  allowDM: true,
}

const slashCmd: SlashCommand = {
  name: "feedback",
  category: "Community",
  onlyAdministrator: false,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("feedback")
      .setDescription("Send feedbacks to the Mochi team")
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("your feedback")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("command")
          .setDescription(
            "a specific command to give feedback. Example: ticker",
          )
          .setRequired(false),
      )
    return data
  },
  run: feedbackSlash,
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}feedback <${SLASH_PREFIX}command> <description>`,
        examples: `${SLASH_PREFIX}feedback i like it\n${SLASH_PREFIX}feedback $gm UI can be better`,
        footer: [`Type ${SLASH_PREFIX}help for more actions!`],
        description:
          "Give feedback for the Mochi team about a specific command or in general",
      }),
    ],
  }),
  colorType: "Command",
}

export default { textCmd, slashCmd }
