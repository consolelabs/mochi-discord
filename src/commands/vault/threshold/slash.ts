import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { runCreateThreshold } from "./processor"

const command: SlashCommand = {
  name: "threshold",
  category: "Config",
  prepare: () => {
    const choices = ["50", "66", "75", "100"]
    return new SlashCommandSubcommandBuilder()
      .setName("threshold")
      .setDescription("Set threshold for vault")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("select vault name")
          .setRequired(true)
      )
      .addStringOption((option) => {
        const o = option
          .setName("value")
          .setDescription("select percent of the approved request")
          .setRequired(true)
        choices.forEach((choice) => o.addChoice(choice + "%", choice))
        return o
      })
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
