import { SlashCommand } from "types/common"
import { CommandInteraction } from "discord.js"
import { SLASH_PREFIX, STATS_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { SlashCommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { handle } from "./stats"

const command: SlashCommand = {
  name: "stats",
  category: "Community",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("stat")
      .setDescription("Shows different server stats")
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }

    return await handle(interaction)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}stats -> select which stats from dropdown -> select which type from dropdown`,
        footer: [`Type ${SLASH_PREFIX}help stats`],
        document: STATS_GITBOOK,
        examples: `${SLASH_PREFIX}stats`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
