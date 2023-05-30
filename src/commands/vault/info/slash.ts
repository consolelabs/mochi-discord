import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { runGetVaultDetail } from "./processor"
import config from "adapters/config"

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
          .setRequired(true)
          .setAutocomplete(true)
      )
  },
  autocomplete: async function (i) {
    if (!i.guildId) {
      await i.respond([])
      return
    }
    const focusedValue = i.options.getFocused()
    const data = await config.vaultList(i.guildId, true)

    await i.respond(
      data
        .filter((d: any) =>
          d.name.toLowerCase().includes(focusedValue.toLowerCase())
        )
        .map((d: any) => ({ name: d.name, value: d.name }))
    )
  },
  run: async function (interaction: CommandInteraction) {
    return await runGetVaultDetail(
      interaction.options.getString("name", true),
      interaction
    )
  },
  help: (interaction: CommandInteraction) =>
    Promise.resolve({
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
