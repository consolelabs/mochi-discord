import config from "adapters/config"
import {
  composeEmbedMessage2,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription(
        "Set a role that users will get when they reach specific a level"
      )
      .addStringOption((option) =>
        option
          .setName("role")
          .setDescription(
            "role which you want to set configuration for level. Example: @admin"
          )
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("level")
          .setDescription(
            "level which you want to set configuration role. Example: 1"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId || !interaction.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }

    const roleArg = interaction.options.getString("role", true)
    if (!roleArg.startsWith("<@&") || !roleArg.endsWith(">")) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description:
                "Invalid role. Be careful to not be mistaken role with username while setting.",
            }),
          ],
        },
      }
    }
    const roleId = roleArg.substring(3, roleArg.length - 1)
    const role = await interaction.guild.roles.fetch(roleId)
    if (!role) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ description: "Role not found" })],
        },
      }
    }
    const args = interaction.options.getString("level", true)
    const level = +args
    if (Number.isNaN(level) || level <= 0 || level >= Infinity) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ description: "Invalid level argument" })],
        },
      }
    }

    const res = await config.configLevelRole({
      guild_id: interaction.guildId,
      role_id: role.id,
      level,
    })
    if (res.ok) {
      return {
        messageOptions: {
          embeds: [
            getSuccessEmbed({
              description: `Successfully configured role <@&${role.id}> for level ${level}`,
            }),
          ],
        },
      }
    }
    let description
    if (res.error.toLowerCase().includes("role has been used")) {
      description = res.error
    }
    return {
      messageOptions: {
        embeds: [getErrorEmbed({ description })],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        title: "Set a level-role configuration",
        usage: `${SLASH_PREFIX}levelrole <role> <level>`,
        examples: `${SLASH_PREFIX}levelrole @Mochi 1`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
