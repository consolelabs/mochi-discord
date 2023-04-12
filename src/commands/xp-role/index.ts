import { Command, SlashCommand } from "types/common"
// text
import set from "./set/text"
import list from "./list/text"
import remove from "./remove/text"
// slash
import setSlash from "./set/slash"
import listSlash from "./list/slash"
import removeSlash from "./remove/slash"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { PREFIX, XP_ROLE_GITBOOK } from "utils/constants"
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
  id: "xprole",
  command: "xprole",
  brief: "XP Role configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}xr <action>\n${PREFIX}xprole <action>`,
        description: "Assign role to users when they earn certain amount of XP",
        examples: `${PREFIX}xr list\n${PREFIX}xprole list\n${PREFIX}xprole set @Mochi 1`,
        footer: [`Type ${PREFIX}help xr <action> for a specific action!`],
        includeCommandsList: true,
        document: XP_ROLE_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["xr"],
  actions,
  colorType: "Server",
  minArguments: 2,
}

const slashActions: Record<string, SlashCommand> = {
  set: setSlash,
  list: listSlash,
  remove: removeSlash,
}

const slashCmd: SlashCommand = {
  name: "xprole",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("xprole")
      .setDescription("XP Role configuration")
    data.addSubcommand(<SlashCommandSubcommandBuilder>setSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>listSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}xprole <action>\n${PREFIX}xprole <action>`,
        description: "Assign role to users when they earn certain amount of XP",
        examples: `${PREFIX}xr list\n${PREFIX}xprole list\n${PREFIX}xprole set @Mochi 1`,
        footer: [`Type ${PREFIX}help xprole <action> for a specific action!`],
        includeCommandsList: true,
        document: XP_ROLE_GITBOOK,
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
