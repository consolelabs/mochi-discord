import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import feedbackSlash from "./index/slash"
import { composeEmbedMessage } from "ui/discord/embed"

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
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("command")
          .setDescription(
            "a specific command to give feedback. Example: ticker"
          )
          .setRequired(false)
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

export default { slashCmd }
