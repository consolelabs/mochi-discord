import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2, getSuccessEmbed } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import CacheManager from "cache/node-cache"
import { getSlashCommand } from "utils/commands"
import { getEmoji } from "utils/common"

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
    const { ok } = await config.setGuildAdminRole({
      guild_id: interaction.guildId,
      role_ids: [roleArg.id],
    })
    if (!ok) {
      throw new InternalError({
        msgOrInteraction: interaction,
        title: "The role has been set!",
        description: `Please choose another role, then run command </bot-manager set:${await getSlashCommand(
          "bot-manager set"
        )}>`,
      })
    }

    CacheManager.findAndRemove("bot-manager", `guild-${interaction.guildId}`)

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: `Successfully set ${roleArg.name} as bot managers!`,
            description: `${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} The bot managers can use all the server management feature, even when they don't have an admin role.\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} You can check the bot managers role by running </bot-manager info:${await getSlashCommand(
              "bot-manager info"
            )}>`,
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
