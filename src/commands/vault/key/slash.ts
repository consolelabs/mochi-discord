import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { runCreateKey } from "./processor"
import config from "adapters/config"

const command: SlashCommand = {
  name: "key",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("key")
      .setDescription("Set key for vault")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("enter vault name")
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addStringOption((option) =>
        option.setName("api_key").setDescription("api key").setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("secret_key")
          .setDescription("secret key")
          .setRequired(true),
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
          d.name.toLowerCase().includes(focusedValue.toLowerCase()),
        )
        .map((d: any) => ({ name: d.name, value: d.name })),
    )
  },
  run: async function (interaction: CommandInteraction) {
    return runCreateKey({
      i: interaction,
      guildId: interaction.guildId ?? undefined,
    })
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}vault config key <api_key> <secret_key>`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
