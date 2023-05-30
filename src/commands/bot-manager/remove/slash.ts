import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import CacheManager from "cache/node-cache"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2, getSuccessEmbed } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { Role } from "discord.js"
import { getSlashCommand } from "utils/commands"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove guild admin role")
      .addRoleOption((opt) =>
        opt
          .setName("role")
          .setDescription("the role to remove")
          .setRequired(true)
      )
  },
  run: async function (interaction) {
    if (!interaction.guildId || !interaction.guild) {
      throw new GuildIdNotFoundError({})
    }

    const { ok, data } = await config.getGuildAdminRoles({
      guildId: interaction.guildId,
    })
    if (!ok) {
      throw new InternalError({
        msgOrInteraction: interaction,
        title: "Failed to remove guild admin role",
        description: "Please try again later.",
      })
    }

    const roleToRemove = interaction.options.getRole("role", true) as Role
    const roleConfig = data.find((d: any) => d.role_id === roleToRemove.id)

    if (data.length === 0 || !roleConfig) {
      throw new InternalError({
        msgOrInteraction: interaction,

        title: "The role hasn't been set as bot managers!",
        description: `You can set the new bot managers role by using ${await getSlashCommand(
          "bot-manager set"
        )}`,
      })
    }

    await config.removeGuildAdminRole(roleConfig.id)
    CacheManager.findAndRemove("bot-manager", `guild-${interaction.guildId}`)
    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: `Successfully removed ${roleToRemove.name} as bot managers!`,
            description: `You can set the new bot managers role by using ${await getSlashCommand(
              "bot-manager set"
            )}`,
          }),
        ],
        components: [],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}bot-manager remove <role>`,
        examples: `${SLASH_PREFIX}bot-manager remove @role`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
