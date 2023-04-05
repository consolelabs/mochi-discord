import { Command, SlashCommand } from "types/common"
import { PREFIX, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import list from "./list/text"
import remove from "./remove/text"
import set from "./set/text"
// slash
import infoSlash from "./info/slash"
import listSlash from "./list/slash"
import removeSlash from "./remove/slash"
import setSlash from "./set/slash"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const actions: Record<string, Command> = {
  list,
  remove,
  set,
}

const textCmd: Command = {
  id: "moniker",
  command: "moniker",
  brief: "Moniker Configuration",
  category: "Config",
  run: async () => null,
  featured: {
    title: "Moniker",
    description: "Manage monikers configuration used in tip",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}moniker <action>`,
        examples: `${PREFIX}moniker list`,
        description: "Manage moniker configuration used in tip",
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

const subCommands: Record<string, SlashCommand> = {
  list: listSlash,
  remove: removeSlash,
  set: setSlash,
  info: infoSlash,
}

const slashCmd: SlashCommand = {
  name: "moniker",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("moniker")
      .setDescription("Moniker configuration")

    data.addSubcommand(<SlashCommandSubcommandBuilder>infoSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>listSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>setSlash.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return subCommands[interaction.options.getSubcommand()].run(interaction)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}moniker <action>`,
        examples: `${SLASH_PREFIX}moniker list`,
        description: "Manage moniker configuration used in tip",
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
