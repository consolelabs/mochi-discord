import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX, MIX_ROLE_GITBOOK } from "utils/constants"
import { process } from "./processor"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a mix role setup")
  },
  run: process,
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}mixrole remove`,
        examples: `${SLASH_PREFIX}mixrole remove`,
        document: `${MIX_ROLE_GITBOOK}&action=remove`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
