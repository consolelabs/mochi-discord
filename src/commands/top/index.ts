import { Command, SlashCommand } from "types/common"
import { PREFIX, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import top from "./index/text"
import topSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const textCmd: Command = {
  id: "top",
  command: "top",
  brief: "Show members with the highest server XP score",
  category: "Community",
  run: top,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}top [page]`,
        examples: `${PREFIX}top\n${PREFIX}top 2`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

const slashCmd: SlashCommand = {
  name: "top",
  category: "Community",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("top")
      .setDescription("Show members with the highest server XP score")
      .addStringOption((option) =>
        option
          .setName("page")
          .setDescription("list page number. Example: 1")
          .setRequired(false)
      )
  },
  run: topSlash,
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}top [page]`,
        examples: `${SLASH_PREFIX}top\n${SLASH_PREFIX}top 2`,
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
