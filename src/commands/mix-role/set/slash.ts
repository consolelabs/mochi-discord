import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX, MIX_ROLE_GITBOOK } from "utils/constants"
import { process } from "./processor"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription(
        "Set a role that user will get when they own have requirement"
      )
  },
  run: (interaction) => process(interaction),
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}mixrole set`,
        examples: `${SLASH_PREFIX}mixrole`,
        document: `${MIX_ROLE_GITBOOK}&action=set`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
