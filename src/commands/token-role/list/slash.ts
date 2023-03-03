import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { PREFIX, TOKEN_ROLE_GITBOOK } from "utils/constants"
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

    const { title, description } = list(res)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage2(interaction, {
            author: [title],
            description,
            color: "#FCD3C1",
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}tokenrole list`,
        examples: `${PREFIX}tokenrole list`,
        document: `${TOKEN_ROLE_GITBOOK}&action=list`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
