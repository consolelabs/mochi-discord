import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { composeNFTListEmbed } from "./processor"

const command: SlashCommand = {
  name: "recent",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("recent")
      .setDescription("Show list of newly added NFTs.")
  },
  run: async function () {
    return await composeNFTListEmbed(0)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        description: "Show list of newly added NFTs",
        usage: `${SLASH_PREFIX}nft recent`,
        examples: `${SLASH_PREFIX}nft recent`,
      }),
    ],
  }),
  colorType: "Market",
}

export default command
