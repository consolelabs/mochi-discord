import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { runCreateThreshold } from "./processor"
import config from "adapters/config"

const command: SlashCommand = {
  name: "threshold",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const choices = ["50", "66", "75", "100"]
    return new SlashCommandSubcommandBuilder()
      .setName("threshold")
      .setDescription("Set threshold for vault")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("enter vault name")
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addStringOption((option) => {
        const o = option
          .setName("threshold")
          .setDescription("enter threshold")
          .setRequired(true)
        choices.forEach((choice) => o.addChoice(choice + "%", choice))
        return o
      })
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
    return runCreateThreshold({
      i: interaction,
      guildId: interaction.guildId ?? undefined,
    })
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}vault config threshold <vault name> <value>`,
        examples: `${SLASH_PREFIX}vault config threshold test 50%`,
        document: `${GM_GITBOOK}&action=streak`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
