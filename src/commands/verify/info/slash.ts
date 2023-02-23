import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX, VERIFY_WALLET_GITBOOK } from "utils/constants"
import { runVerify } from "./processor"

const command: SlashCommand = {
  name: "info",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Show verify channel")
  },
  run: async (interaction: CommandInteraction) =>
    runVerify(null, interaction.guildId),
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}verify info`,
        examples: `${SLASH_PREFIX}verify info`,
        document: `${VERIFY_WALLET_GITBOOK}&action=info`,
        footer: [
          `Type ${SLASH_PREFIX}help verify <action> for a specific action!`,
        ],
      }),
    ],
  }),
  colorType: "Server",
}
export default command
