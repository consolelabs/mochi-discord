import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX, VERIFY_WALLET_GITBOOK } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { runVerifySet } from "./processor"

const command: SlashCommand = {
  name: "set",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Create wallet verification channel")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription(
            "the channel which you wanna verify your wallet. Example: #general"
          )
          .setRequired(true)
      )
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription(
            "the role to assign to user when they are verified. Example: @verified"
          )
          .setRequired(false)
      )
  },
  run: async (interaction: CommandInteraction) =>
    runVerifySet({ interaction, guildId: interaction.guildId }),
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}verify set <channel> [<verified_role>]`,
        examples: `${SLASH_PREFIX}verify set #general\n${SLASH_PREFIX}verify set #connect-wallet @verified`,
        document: `${VERIFY_WALLET_GITBOOK}&action=set`,
        footer: [
          `Type ${SLASH_PREFIX}help verify <action> for a specific action!`,
        ],
      }),
    ],
  }),
  colorType: "Server",
}
export default command
