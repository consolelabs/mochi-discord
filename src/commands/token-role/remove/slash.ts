import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a token-role configuration")
  },
}
