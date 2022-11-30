import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { CommandArgumentError } from "errors"
import { handleNftTicker } from "../nft/ticker"

const command: SlashCommand = {
  name: "ticker",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("ticker")
      .setDescription("Check an NFT collection ticker.")
      .addStringOption((option) =>
        option
          .setName("symbol")
          .setDescription("NFT symbol. Example: neko")
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const symbol = interaction.options.getString("symbol")
    if(!symbol){
        throw new CommandArgumentError({message: interaction, getHelpMessage: () => this.help(interaction)})
    }

    return await handleNftTicker(interaction, symbol, interaction.user.id)

  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        description: "Check an NFT collection ticker.",
        usage: `${SLASH_PREFIX}nft ticker <collection_symbol>`,
        examples: `${SLASH_PREFIX}nft ticker neko`,
      }),
    ],
  }),
  colorType: "Market",
}

export default command
