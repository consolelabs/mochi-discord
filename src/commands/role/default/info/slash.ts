import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { renderDefaultRole } from "commands/roles/index/processor"
import config from "adapters/config"
import { GuildIdNotFoundError } from "errors"

const command: SlashCommand = {
  name: "info",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Show current default role for newcomers")
  },
  run: async (i) => {
    if (!i.guildId) {
      throw new GuildIdNotFoundError({})
    }
    const res = await config.getCurrentDefaultRole(i.guildId)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["Default role"],
            description: renderDefaultRole(res.data),
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}role default info`,
        examples: `${SLASH_PREFIX}role default info`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
