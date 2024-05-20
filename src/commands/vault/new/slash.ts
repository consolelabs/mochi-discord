import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { runCreateVault } from "./processor"

const command: SlashCommand = {
  name: "new",
  category: "Config",
  prepare: () => {
    const thresholdChoices = ["50", "66", "75", "100"]
    return new SlashCommandSubcommandBuilder()
      .setName("new")
      .setDescription("Set vault for guild")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("enter vault name")
          .setRequired(true),
      )
      .addStringOption((option) => {
        const o = option
          .setName("threshold")
          .setDescription("enter threshold")
          .setRequired(true)
        thresholdChoices.forEach((choice) => o.addChoice(choice + "%", choice))
        return o
      })
      .addStringOption((option) => {
        const o = option
          .setName("type")
          .setDescription("what is the type of this vault")
          .setRequired(false)
        o.addChoice("spot", "spot")
        o.addChoice("trading", "trading")

        return o
      })
  },
  run: async function (interaction: CommandInteraction) {
    return runCreateVault({
      i: interaction,
      guildId: interaction.guildId ?? undefined,
    })
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}vault new <name> <threshold>`,
        examples: `${SLASH_PREFIX}vault new test 50`,
        document: `${GM_GITBOOK}&action=streak`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
