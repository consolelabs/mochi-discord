import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { runGetVaultInfo, runGetVaultDetail } from "./processor"
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
    const { ok, data } = await config.vaultList(i.guildId)
    if (!ok) {
      await i.respond([])
      return
    }

    await i.respond(
      data
        .filter((d: any) =>
          d.name.toLowerCase().includes(focusedValue.toLowerCase())
        )
        .map((d: any) => ({ name: d.name, value: d.name }))
    )
  },
  run: async function (interaction: CommandInteraction) {
    if (interaction.options.getString("name", false)) {
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
