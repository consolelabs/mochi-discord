import { SlashCommand } from "types/common"
import { SLASH_PREFIX, GM_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import set from "./set"
import info from "./info"
import streak from "./streak"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const subCommands: Record<string, SlashCommand> = {
  info,
  set,
  streak,
}

const command: SlashCommand = {
  name: "gm",
  category: "Community",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("gm")
      .setDescription(
        "Configure a good morning/good night channel for users to engage and keep streaks"
      )

    data.addSubcommand(<SlashCommandSubcommandBuilder>info.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>set.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>streak.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return subCommands[interaction.options.getSubcommand()].run(interaction)
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
