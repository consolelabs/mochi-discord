import { SlashCommand } from "types/common"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
// import { info, welcomeInfo } from "./info"
// import { set, setWelcome } from "./set"
// import { remove, removeWelcome } from "./remove"
// import { message, setWelcomeMessage } from "./message"
import { composeEmbedMessage } from "discord/embed/ui"
import infoSlash from "./info/slash"
import setSlash from "./set/slash"
import removeSlash from "./remove/slash"
import messageSlash from "./message/slash"

const slashActions: Record<string, SlashCommand> = {
  info: infoSlash,
  set: setSlash,
  remove: removeSlash,
  message: messageSlash,
}

const slashCmd: SlashCommand = {
  name: "welcome",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("welcome")
      .setDescription("Welcome new members to the guild")
    data.addSubcommand(<SlashCommandSubcommandBuilder>infoSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>setSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>messageSlash.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default { slashCmd }
