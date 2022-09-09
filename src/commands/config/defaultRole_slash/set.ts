import config from "adapters/config"
import {
  composeEmbedMessage2,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { DefaultRoleEvent, SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { parseDiscordToken } from "utils/commands"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Set a default role for newcomers")
      .addStringOption((option) =>
        option
          .setName("role")
          .setDescription("role for newcomers")
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
    const { isRole, isId, id } = parseDiscordToken(roleArg ?? "")
    if (!isRole || !isId) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Invalid role",
              description:
                "Make sure it is really a role in your server, some common mistakes are: role that is not in your server or some username is the same with the role you're setting.",
            }),
          ],
        },
      }
    }
    let description = ""
    const requestData: DefaultRoleEvent = {
      guild_id: interaction.guildId,
      role_id: id,
    }
    const res = await config.configureDefaultRole(requestData)
    if (res.ok) {
      description = `Role <@&${requestData.role_id}> is now configured as newcomer's default role`
    } else {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ description: res.error })],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [getSuccessEmbed({ title: "Default role set", description })],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        title: "Set a default role for newcomers",
        usage: `${SLASH_PREFIX}defaultrole set <role>`,
        examples: `${SLASH_PREFIX}defaultrole set @Mochi`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
