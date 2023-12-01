import config from "adapters/config"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { APIError, GuildIdNotFoundError } from "errors"
import { handle } from "../processor"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove default role for newcomers")
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId || !interaction.guild) {
      throw new GuildIdNotFoundError({})
    }

    const res = await config.removeDefaultRoleConfig(interaction.guildId)
    if (!res.ok) {
      throw new APIError({
        msgOrInteraction: interaction,
        error: res.error,
        description: res.log,
        curl: res.curl,
        status: res.status ?? 500,
      })
    }

    return handle(interaction, "Default role removed")
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}role default remove`,
        examples: `${SLASH_PREFIX}role default remove`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
