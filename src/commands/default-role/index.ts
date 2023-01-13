import { Command, SlashCommand } from "types/common"
import { DEFAULT_ROLE_GITBOOK, PREFIX, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage, composeEmbedMessage2 } from "discord/embed/ui"
import { getEmoji } from "utils/common"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
// text
import info from "./info/text"
import remove from "./remove/text"
import set from "./set/text"
// slash
import infoSlash from "./info/slash"
import removeSlash from "./remove/slash"
import setSlash from "./set/slash"

const actions: Record<string, Command> = {
  info,
  remove,
  set,
}

const textCmd: Command = {
  id: "defaultrole",
  command: "defaultrole",
  brief: "Default Role Configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  featured: {
    title: `${getEmoji("")} Default role`,
    description:
      "Set a default role that will automatically assigned to newcomers when they first join your server",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}dr <action>\n${PREFIX}defaultrole <action>`,
        examples: `${PREFIX}defaultrole info\n${PREFIX}dr info\n${PREFIX}defaultrole set @visitor`,
        description:
          "Set a default role that will automatically assigned to newcomers when they first join your server",
        footer: [`Type ${PREFIX}help dr <action> for a specific action!`],
        includeCommandsList: true,
        document: DEFAULT_ROLE_GITBOOK,
      }),
    ],
  }),
  aliases: ["dr"],
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

const slashActions: Record<string, SlashCommand> = {
  info: infoSlash,
  remove: removeSlash,
  set: setSlash,
}

const slashCmd: SlashCommand = {
  name: "defaultrole",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("defaultrole")
      .setDescription("Default Role Configuration")
    data.addSubcommand(<SlashCommandSubcommandBuilder>infoSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>setSlash.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}defaultrole <sub-command>`,
        examples: `${SLASH_PREFIX}defaultrole info\n${SLASH_PREFIX}dr info\n${SLASH_PREFIX}defaultrole set @visitor`,
        description:
          "Set a default role that will automatically assigned to newcomers when they first join your server",
        footer: [`Type ${SLASH_PREFIX}help dr <action> for a specific action!`],
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
