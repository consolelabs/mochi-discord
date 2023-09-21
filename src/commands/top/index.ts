import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { SlashCommandBuilder } from "@discordjs/builders"

const slashCmd: SlashCommand = {
  name: "top",
  category: "Community",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("top")
      .setDescription("Show top senders and receivers")
  },
  run: async function (i) {},
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          usage: `${SLASH_PREFIX}top [page]`,
          examples: `${SLASH_PREFIX}top\n${SLASH_PREFIX}top 2`,
        }),
      ],
    }),
  colorType: "Server",
}

export default { slashCmd }
