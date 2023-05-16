import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2, getSuccessEmbed } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import CacheManager from "cache/node-cache"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Set guild admin role")
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription(
            "the role which you wanna set as admin. Example: @admin"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction) {
    if (!interaction.guildId || !interaction.guild) {
      throw new GuildIdNotFoundError({})
    }
    const roleArg = interaction.options.getRole("role", true)
    const { ok, error, curl, log } = await config.setGuildAdminRole({
      guild_id: interaction.guildId,
      role_ids: [roleArg.id],
    })
    if (!ok) {
      throw new APIError({
        msgOrInteraction: interaction,
        error,
        curl,
        description: log,
      })
    }

    CacheManager.findAndRemove("bot-manager", `guild-${interaction.guildId}`)

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: `Successfully set ${roleArg.name} as admin role.`,
            description:
              "Now you can use `/bot-manager info` to check the current admin role.",
            originalMsgAuthor: interaction.user,
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}bot-manager set <role>`,
        examples: `${SLASH_PREFIX}bot-manager set @admin`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
