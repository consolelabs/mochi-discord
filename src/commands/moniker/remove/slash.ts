import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { InternalError } from "errors"
import { RequestDeleteMonikerConfigRequest } from "types/api"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
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
          .setDescription("moniker you want to remove")
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "This command must be run in a guild",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }
    const moniker = interaction.options.getString("moniker", true)
    if (!moniker) {
      throw new InternalError({
        msgOrInteraction: interaction,
        description: "Invalid moinker",
      })
    }
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
