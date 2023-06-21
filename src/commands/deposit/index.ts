import { SlashCommand } from "types/common"
import { CommandInteraction } from "discord.js"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SlashCommandBuilder } from "@discordjs/builders"
import * as depositSlash from "./index/slash"

const slashCmd: SlashCommand = {
  name: "deposit",
  category: "Defi",
  prepare: (alias = "deposit") => {
    return new SlashCommandBuilder()
      .setName(alias)
      .setDescription("Deposit your tokens into your discord wallet")
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("the token symbol which you wanna deposit")
          .setRequired(true)
      )
      .addNumberOption((opt) =>
        opt
          .setName("amount")
          .setDescription("the amount you want to deposit")
          .setRequired(false)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const symbol = interaction.options.getString("token", true)
    const amount = interaction.options.getNumber("amount", false)
    return await depositSlash.run(interaction, symbol, amount ?? 1)
  },
  help: (interaction: CommandInteraction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage2(interaction, {
          usage: `${SLASH_PREFIX}deposit <token>`,
          examples: `${SLASH_PREFIX}deposit ftm`,
        }),
      ],
    }),
  colorType: "Defi",
  ephemeral: true,
}

export default { slashCmd }
