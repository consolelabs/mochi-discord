import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { PREFIX, LOG_CHANNEL_GITBOOK, SLASH_PREFIX } from "utils/constants"
// text
import set from "./set/text"
import info from "./info/text"
// slash
import setSlash from "./set/slash"
import infoSlash from "./info/slash"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const actions: Record<string, Command> = {
  set,
  info,
}

const textCmd: Command = {
  id: "log",
  command: "log",
  brief: "Monitor guild members' activities",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        includeCommandsList: true,
        usage: `${PREFIX}log <action>`,
        description:
          "Configure a log channel to monitor guild members' activities",
        footer: [`Type ${PREFIX}help log <action> for a specific action!`],
        document: LOG_CHANNEL_GITBOOK,
        title: "Log channel",
        examples: `${PREFIX}log info\n${PREFIX}log set #log-channel`,
      }),
    ],
  }),
  colorType: "Server",
  actions,
}

const slashActions: Record<string, SlashCommand> = {
  info: infoSlash,
  set: setSlash,
}

const slashCmd: SlashCommand = {
  name: "log",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("log")
      .setDescription("Monitor guild members' activities")
    data.addSubcommand(<SlashCommandSubcommandBuilder>infoSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>setSlash.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (i) => ({
    embeds: [
      composeEmbedMessage2(i, {
        includeCommandsList: true,
        usage: `${SLASH_PREFIX}log <action>`,
        description:
          "Configure a log channel to monitor guild members' activities",
        footer: [
          `Type ${SLASH_PREFIX}help log <action> for a specific action!`,
        ],
        document: LOG_CHANNEL_GITBOOK,
        title: "Log channel",
        examples: `${SLASH_PREFIX}log info\n${SLASH_PREFIX}log set #log-channel`,
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
