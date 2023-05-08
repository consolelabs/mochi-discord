import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { runTransferTreasurer } from "./processor"

const command: SlashCommand = {
  name: "transfer",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("transfer")
      .setDescription("Transfer crypto from to wallet address")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("enter vault name")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("address")
          .setDescription("enter wallet address")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option.setName("chain").setDescription("choose chain").setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("enter token symbol")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("amount")
          .setDescription("enter amount")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("enter a message for user")
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    return await runTransferTreasurer({
      i: interaction,
      guildId: interaction.guildId ?? undefined,
    })
  },
  help: async (interaction: CommandInteraction) =>
    await {
      embeds: [
        composeEmbedMessage2(interaction, {
          usage: `${SLASH_PREFIX}vault treasurer transfer <address> <chain> <symbol> <amount> <message>`,
          examples: `${SLASH_PREFIX}vault treasurer transfer 0x140... ftm usdc 100 hello`,
          document: `${GM_GITBOOK}&action=streak`,
        }),
      ],
    },
  colorType: "Server",
}

export default command
