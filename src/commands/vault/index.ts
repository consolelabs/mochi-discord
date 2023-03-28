import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { LOG_CHANNEL_GITBOOK, SLASH_PREFIX } from "utils/constants"

// slash
import newSlash from "./new/slash"
import listSlash from "./list/slash"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const slashActions: Record<string, SlashCommand> = {
  list: listSlash,
  new: newSlash,
}

const slashCmd: SlashCommand = {
  name: "vault",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("vault")
      .setDescription("Setup vault for your guild")
    data.addSubcommand(<SlashCommandSubcommandBuilder>listSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>newSlash.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (i) => ({
    embeds: [
      composeEmbedMessage2(i, {
        includeCommandsList: true,
        usage: `${SLASH_PREFIX}vault <action>`,
        description: "Setup vault for your guild",
        footer: [
          `Type ${SLASH_PREFIX}help vault <action> for a specific action!`,
        ],
        document: LOG_CHANNEL_GITBOOK,
        title: "Vault",
        examples: `${SLASH_PREFIX}vault list\n${SLASH_PREFIX}vault new`,
      }),
    ],
  }),
  colorType: "Server",
}

export default { slashCmd }
