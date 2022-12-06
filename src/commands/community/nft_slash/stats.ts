import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handleNftStats } from "../nft/stats"

const command: SlashCommand = {
  name: "stats",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("stats")
      .setDescription("Show total collections added.")
  },
  run: async function (interaction: CommandInteraction) {
    return await handleNftStats(interaction)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        description: "Show total collections added.",
        usage: `${SLASH_PREFIX}nft stats`,
        examples: `${SLASH_PREFIX}nft stats`,
      }),
    ],
  }),
  colorType: "Market",
}

export default command
