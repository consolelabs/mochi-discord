import config from "adapters/config"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Role } from "discord.js"
import { DefaultRoleEvent, SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { APIError, GuildIdNotFoundError } from "errors"
import { handle } from "../processor"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Set a default role for newcomers")
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("role for newcomers. Example: @admin")
          .setRequired(true),
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }

    const roleArg = interaction.options.getRole("role", true) as Role
    const requestData: DefaultRoleEvent = {
      guild_id: interaction.guildId,
      role_id: roleArg.id,
    }
    const res = await config.configureDefaultRole(requestData)
    if (!res.ok) {
      throw new APIError({
        curl: res.curl,
        description: res.log,
        msgOrInteraction: interaction,
        error: res.error,
        status: res.status ?? 500,
      })
    }

    return handle(interaction, "Default role updated")
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        title: "Set a default role for newcomers",
        usage: `${SLASH_PREFIX}role default set <role>`,
        examples: `${SLASH_PREFIX}role default set @Mochi`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
