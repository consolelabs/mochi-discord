import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { CommandArgumentError } from "errors"
import { ChartStyle, handleNftTicker } from "./processor"

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
      .addStringOption((option) =>
        option
          .setName("chart")
          .setDescription("Chart style")
          .setRequired(false)
          .addChoices([
            ["Plot", "plot"],
            ["Line", "line"],
          ])
      )
  },
  run: async function (interaction: CommandInteraction) {
    const symbol = interaction.options.getString("symbol")
    if (!symbol) {
      throw new CommandArgumentError({
        message: interaction,
        getHelpMessage: () => this.help(interaction),
      })
    }

    const chartStyleInput = interaction.options.getString("chart") ?? "plot"
    const chartStyle =
      chartStyleInput === "plot" ? ChartStyle.Plot : ChartStyle.Line

    return await handleNftTicker(interaction, symbol, chartStyle)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        description: "Check an NFT collection ticker.",
        usage: `${SLASH_PREFIX}nft ticker <collection_symbol>`,
        examples: `${SLASH_PREFIX}nft ticker neko`,
      }),
    ],
  }),
  colorType: "Market",
}

export default command
