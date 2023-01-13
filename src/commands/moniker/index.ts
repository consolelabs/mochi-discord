import { Command, SlashCommand } from "types/common"
import { PREFIX, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "discord/embed/ui"
import list from "./list/text"
import remove from "./remove/text"
import set from "./set/text"
// slash
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
  id: "monikers",
  command: "monikers",
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
        usage: `${PREFIX}monikers <action>`,
        examples: `${PREFIX}monikers list`,
        description: "Manage monikers configuration used in tip",
        includeCommandsList: true,
      }),
    ],
  }),
  aliases: ["moniker"],
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

const subCommands: Record<string, SlashCommand> = {
  list: listSlash,
  remove: removeSlash,
  set: setSlash,
}

const slashCmd: SlashCommand = {
  name: "monikers",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("monikers")
      .setDescription("Moniker configuration")
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
        usage: `${SLASH_PREFIX}monikers <action>`,
        examples: `${SLASH_PREFIX}monikers list`,
        description: "Manage monikers configuration used in tip",
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
