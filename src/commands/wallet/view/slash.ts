import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX, WALLET_GITBOOK } from "utils/constants"
import { viewWalletDetails, viewWalletsList } from "./processor"

const command: SlashCommand = {
  name: "view",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("view")
      .setDescription("Show all your interested wallets assets and activities.")
      .addStringOption((option) =>
        option
          .setName("address")
          .setDescription(
            "The address or alias of the wallet you want to track"
          )
          .setRequired(false)
      )
  },
  run: async (interaction) => {
    const author = interaction.user
    const address = interaction.options.getString("address", false)
    if (address) {
      return await viewWalletDetails(interaction, author, address)
    }
    return await viewWalletsList(interaction, author)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}wallet view [address]/[alias]`,
        examples: `${SLASH_PREFIX}wallet view\n${SLASH_PREFIX}wallet view 0xfBe6403a719d0572Ea4BA0E1c01178835b1D3bE4\n${SLASH_PREFIX}wallet view mywallet`,
        document: `${WALLET_GITBOOK}&action=view`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
