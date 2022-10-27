import { SlashCommand } from "types/common"
import { SLASH_PREFIX, GM_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { set, gmSet } from "./set"
import { info, gmInfo } from "./info"
import { streak, gmStreak } from "./streak"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const command: SlashCommand = {
  name: "gm",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("gm")
      .setDescription(
        "Configure a good morning/good night channel for users to engage and keep streaks"
      )

    data.addSubcommand(set).addSubcommand(info).addSubcommand(streak)
    return data
  },
  run: async function (interaction: CommandInteraction) {
    switch (interaction.options.getSubcommand()) {
      case set.name:
        return gmSet(interaction)
      case info.name:
        return gmInfo(interaction)
      case streak.name:
        return gmStreak(interaction)
    }
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}gm <action>`,
        examples: `${SLASH_PREFIX}gm streak`,
        footer: [`Type ${SLASH_PREFIX}help gm <action> for a specific action!`],
        description:
          "Configure a good morning/good night channel for users to engage and keep streaks",
        includeCommandsList: true,
        document: GM_GITBOOK,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
