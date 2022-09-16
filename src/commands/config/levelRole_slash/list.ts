import config from "adapters/config"
import { composeEmbedMessage2, getErrorEmbed } from "utils/discordEmbed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"

const command: SlashCommand = {
  name: "list",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("Get server's levelroles configuration")
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
    const lrConfig = await config.getGuildLevelRoleConfigs(interaction.guildId)

    if (!lrConfig || !lrConfig.ok || !lrConfig.data?.length) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: `${interaction.guild.name}'s levelroles configuration`,
              description:
                "No configuration found! To set a new one, run `$lr <role> <level>`.",
            }),
          ],
        },
      }
    }
    const description = lrConfig.data
      .map((c: any) => `**Level ${c.level}** - <@&${c.role_id}>`)
      .join("\n")
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage2(interaction, {
            author: [
              `${interaction.guild.name}'s levelroles configuration`,
              interaction.guild.iconURL(),
            ],
            description,
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        title: "Get server's levelroles configuration",
        usage: `${SLASH_PREFIX}levelrole set <role> <level>`,
        examples: `${SLASH_PREFIX}levelrole set @Mochi 1`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
