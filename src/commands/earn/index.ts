import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"

const slashCmd: SlashCommand = {
  name: "earn",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("earn")
      .setDescription("view earning opportunies")
  },

  run: () =>
    Promise.resolve({
      messageOptions: {
        content: "earn",
      },
    }),
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          usage: `${SLASH_PREFIX}earn`,
        }),
      ],
    }),

  colorType: "Defi",
}

export default { slashCmd }
