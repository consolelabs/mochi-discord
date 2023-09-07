import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { RequestDeleteMonikerConfigRequest } from "types/api"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { handleRemoveMoniker } from "./processor"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a moniker configuration")
      .addStringOption((option) =>
        option
          .setName("moniker")
          .setDescription("enter moniker you want to remove")
          .setRequired(true),
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({ message: interaction })
    }
    const moniker = interaction.options.getString("moniker", true)
    const payload: RequestDeleteMonikerConfigRequest = {
      guild_id: interaction.guildId,
      moniker,
    }
    return await handleRemoveMoniker(payload)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${PREFIX}monikers remove <moniker>`,
        examples: `${PREFIX}monikers remove cup of coffee`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
