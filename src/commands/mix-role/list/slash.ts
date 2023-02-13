import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX, MIX_ROLE_GITBOOK } from "utils/constants"
import { process } from "./processor"

const command: SlashCommand = {
  name: "list",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("List all the mix role setup")
  },
  run: process,
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}mixrole list`,
        examples: `${SLASH_PREFIX}mixrole list`,
        document: `${MIX_ROLE_GITBOOK}&action=list`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
