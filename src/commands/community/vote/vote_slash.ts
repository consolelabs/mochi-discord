import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { handle } from "./"

const command: SlashCommand = {
  name: "vote",
  category: "Community",
  help: async () => {
    return {
      embeds: [
        composeEmbedMessage(null, {
          usage: `${PREFIX}vote`,
          includeCommandsList: true,
        }),
      ],
    }
  },
  colorType: "Server",
  prepare: () => {
    return new SlashCommandBuilder()
      .setDescription("Display voting streaks and links to vote")
      .setName("vote")
  },
  ephemeral: true,
  run: async (i) => handle(i.user),
}

export default command
