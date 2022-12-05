import { SlashCommand } from "types/common"
import {
  SLASH_PREFIX,
  DEFI_DEFAULT_FOOTER,
  DEPOSIT_GITBOOK,
} from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { handleDeposit } from "../deposit"

const command: SlashCommand = {
  name: "deposit",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("deposit")
      .setDescription("Deposit tokens into your in-discord wallet")
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("token symbol. Example: eth")
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const token = interaction.options.getString("token")
    if (!token) {
      return { messageOptions: await this.help(interaction) }
    }
    return await handleDeposit(interaction, interaction.user, token)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}deposit <currency>`,
        description: "Offchain deposit token",
        examples: `${SLASH_PREFIX}deposit eth`,
        footer: [DEFI_DEFAULT_FOOTER],
        document: DEPOSIT_GITBOOK,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
