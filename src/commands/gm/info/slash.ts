import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handle } from "./processor"

const command: SlashCommand = {
  name: "info",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Show gm channel")
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guild || !interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }
    return await handle(interaction.guildId)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        description: "Show current gm/gn configuration",
        usage: `${SLASH_PREFIX}gm info`,
        examples: `${SLASH_PREFIX}gm info`,
        document: `${GM_GITBOOK}&action=info`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
