import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import CacheManager from "cache/node-cache"
import { list } from "commands/bot-manager/processor"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX, GM_GITBOOK } from "utils/constants"

const command: SlashCommand = {
  name: "info",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Get guild admin role list")
  },
  run: async function (interaction) {
    if (!interaction.guildId || !interaction.guild) {
      throw new GuildIdNotFoundError({})
    }

    const { data, ok } = await CacheManager.get({
      pool: "bot-manager",
      key: `guild-${interaction.guildId}`,
      call: () =>
        config.getGuildAdminRoles({ guildId: interaction.guildId ?? "" }),
    })

    if (!ok) {
      throw new InternalError({
        msgOrInteraction: interaction,
        title: "Failed to get guild admin roles",
        description: "Please try again later.",
      })
    }

    const { title, description } = list(data as any)

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage2(interaction, {
            title,
            description,
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}gm set <channel>`,
        examples: `${SLASH_PREFIX}gm set #general`,
        document: `${GM_GITBOOK}&action=config`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
