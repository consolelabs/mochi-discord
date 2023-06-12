import { SlashCommand } from "types/common"
import stats from "./index/slash"
import { composeEmbedMessage } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommandBuilder } from "@discordjs/builders"

const slashCmd: SlashCommand = {
  name: "stats",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("stats")
      .setDescription("Shows different server stats")
  },
  run: stats,
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}stats -> select which stats from dropdown -> select which type from dropdown`,
        footer: [`Type ${SLASH_PREFIX}help stats`],
        examples: `${SLASH_PREFIX}stats`,
      }),
    ],
  }),
  colorType: "Server",
}

export default { slashCmd }
