import { SlashCommand } from "types/common"
import {
  SLASH_PREFIX,
  DEFI_DEFAULT_FOOTER,
  BALANCE_GITBOOK,
} from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { thumbnails } from "utils/common"
import { handleBal } from "../balances"

const command: SlashCommand = {
  name: "balances",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("balances")
      .setDescription("Show your balances")
  },
  run: async function (interaction: CommandInteraction) {
    return handleBal(interaction.user.id)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: thumbnails.TOKENS,
        usage: `${SLASH_PREFIX}balance`,
        description: "Show your offchain balances",
        footer: [DEFI_DEFAULT_FOOTER],
        examples: `${SLASH_PREFIX}balance\n${SLASH_PREFIX}bals\n${SLASH_PREFIX}bal`,
        document: BALANCE_GITBOOK,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
