import { Command, SlashCommand } from "types/common"
import { LEVEL_ROLE_GITBOOK, PREFIX, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
// text
import set from "./set/text"
import list from "./list/text"
import remove from "./remove/text"
// slash
import setSlash from "./set/slash"
import listSlash from "./list/slash"
import removeSlash from "./remove/slash"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const actions: Record<string, Command> = {
  set,
  list,
  remove,
}

const textCmd: Command = {
  id: "levelrole",
  command: "levelrole",
  brief: "Level Role Configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}lr set <role> <level>\n${PREFIX}lr <action>`,
        examples: `${PREFIX}levelrole list\n${PREFIX}levelrole set @Mochi 1\n${PREFIX}lr set @admin 2`,
        description: "Assign a role to users when they reach a certain level",
        document: LEVEL_ROLE_GITBOOK,
        footer: [
          `Type ${PREFIX}help levelrole <action> for a specific action!`,
        ],
        includeCommandsList: true,
      }),
    ],
  }),
  canRunWithoutAction: false,
  aliases: ["lr"],
  actions,
  colorType: "Server",
  minArguments: 3,
}

const subCommands: Record<string, SlashCommand> = {
  list: listSlash,
  remove: removeSlash,
  set: setSlash,
}

const slashCmd: SlashCommand = {
  name: "levelrole",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("levelrole")
      .setDescription("Level-role configuration")
    data.addSubcommand(<SlashCommandSubcommandBuilder>listSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>setSlash.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return subCommands[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        title: "Manage your level-role configuration",
        usage: `${SLASH_PREFIX}levelrole <sub-command>`,
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
