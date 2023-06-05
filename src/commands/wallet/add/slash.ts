import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { WALLET_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { handleWalletAddition } from "./processor"

const command: SlashCommand = {
  name: "add",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("add")
      .setDescription("Save your interested wallet address with an alias.")
  },
  run: async function (interaction: CommandInteraction) {
    const msgOpts = await handleWalletAddition(interaction)

    interaction.editReply(msgOpts)
  },
  help: (interaction: CommandInteraction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage2(interaction, {
          usage: `${SLASH_PREFIX}wallet add`,
          examples: `${SLASH_PREFIX}wallet add`,
          document: WALLET_GITBOOK,
        }),
      ],
    }),
  colorType: "Defi",
}

export default command
