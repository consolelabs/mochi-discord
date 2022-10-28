import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { handle } from "../gm/streak"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"

const command: SlashCommand = {
  name: "streak",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("streak")
      .setDescription("Show your gm/gn streak")
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guild || !interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }

    return await handle(interaction.user.id, interaction.guildId)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}gm streak`,
        examples: `${SLASH_PREFIX}gm streak`,
        document: `${GM_GITBOOK}&action=streak`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
