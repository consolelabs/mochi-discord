import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import * as processor from "./processor"

const command: SlashCommand = {
  name: "add",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("add")
      .setDescription("Add a price alert to be notified when the price change")
      .addStringOption((option) =>
        option
          .setName("symbol")
          .setDescription("symbol of token to set alert")
          .setRequired(true)
      )
  },
  run: async (interaction: CommandInteraction) => {
    const symbol = interaction.options.getString("symbol", true)
    return await processor.handlePriceAlertAdd(interaction, symbol)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}alert add <token>`,
        examples: `${PREFIX}alert add ftm`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
