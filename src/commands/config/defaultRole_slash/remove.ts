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
  name: "remove",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove default role for newcomers")
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
    let description = ""
    const res = await config.removeDefaultRoleConfig(interaction.guildId)
    if (res.ok) {
      description =
        "Existing users' role will not be affected\nHowever please **NOTE** that from now on new users joining your server won't have a default role anymore.\nTo set a new one, run `/defaultrole set @<role_name>`"
    } else {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ description: res.error })],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [getSuccessEmbed({ title: "Role removed", description })],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}defaultrole remove`,
        examples: `${SLASH_PREFIX}defaultrole remove`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
