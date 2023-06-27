import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SLASH_PREFIX, VERIFY_WALLET_GITBOOK } from "utils/constants"
import { runCurrencyInfo } from "./processor"

const command: SlashCommand = {
  name: "info",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Show default currency")
  },
  run: async (interaction: CommandInteraction) =>
    await runCurrencyInfo(null, interaction.guildId),
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          usage: `${SLASH_PREFIX}config currency info`,
          examples: `${SLASH_PREFIX}config currency info`,
          document: `${VERIFY_WALLET_GITBOOK}&action=info`,
          footer: [
            `Type ${SLASH_PREFIX}help config currency <action> for a specific action!`,
          ],
        }),
      ],
    }),
  colorType: "Server",
}
export default command
