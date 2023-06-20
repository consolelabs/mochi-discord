import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { msgColors } from "utils/common"
import { SLASH_PREFIX as PREFIX, TOKEN_ROLE_GITBOOK } from "utils/constants"
import { list } from "../processor"

const command: SlashCommand = {
  name: "list",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("List all the token role setup")
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId || !interaction.guild) {
      throw new GuildIdNotFoundError({})
    }

    const res = await config.getConfigTokenRoleList(interaction.guildId)
    if (!res.ok) {
      throw new APIError({
        msgOrInteraction: interaction,
        curl: res.curl,
        description: res.log,
      })
    }

    const { title, description } = await list(res)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(interaction, {
            author: [title],
            description,
            color: msgColors.PINK,
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        usage: `${PREFIX}role token list`,
        examples: `${PREFIX}role token list`,
        document: `${TOKEN_ROLE_GITBOOK}&action=list`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
