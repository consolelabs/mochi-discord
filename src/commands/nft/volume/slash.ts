import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handleNftVolume } from "./processor"

const command: SlashCommand = {
  name: "volume",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("volume")
      .setDescription("Show top NFT volume.")
  },
  run: async function (interaction: CommandInteraction) {
    return await handleNftVolume(interaction)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        description: "Show top NFT volume.",
        usage: `${SLASH_PREFIX}nft volume`,
        examples: `${SLASH_PREFIX}nft volume`,
      }),
    ],
  }),
  colorType: "Market",
}

export default command
