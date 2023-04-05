import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { runGetVaultInfo, runGetVaultDetail } from "./processor"

const command: SlashCommand = {
  name: "info",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Vault info")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("enter a vault name")
          .setRequired(false)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (interaction.options.getString("name", false)) {
      console.log("in case show vault detail")
      return runGetVaultDetail({
        i: interaction,
        guildId: interaction.guildId ?? undefined,
      })
    }
    return runGetVaultInfo({
      i: interaction,
      guildId: interaction.guildId ?? undefined,
    })
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}vault info`,
        examples: `${SLASH_PREFIX}vault info`,
        document: `${GM_GITBOOK}&action=streak`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
