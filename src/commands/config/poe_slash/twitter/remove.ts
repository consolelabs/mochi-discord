import { SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { handlePoeTwitterRemove } from "commands/config/poe/twitter/remove"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a server's Twitter PoE configurations.")
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({ message: interaction })
    }
    return await handlePoeTwitterRemove(interaction, interaction.guildId)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}poe twitter remove`,
        examples: `${PREFIX}poe twitter remove`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
