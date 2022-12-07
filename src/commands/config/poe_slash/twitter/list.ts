import { SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { handlePoeTwitterList } from "commands/config/poe/twitter/list"

const command: SlashCommand = {
  name: "list",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("List all server's Twitter PoE configurations")
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({ message: interaction })
    }
    return await handlePoeTwitterList(interaction, interaction.guildId)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}poe twitter list`,
        examples: `${PREFIX}poe twitter list`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
