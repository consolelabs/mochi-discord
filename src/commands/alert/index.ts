import { Command, SlashCommand } from "types/common"
import { PREFIX, PRICE_ALERT_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { CommandInteraction } from "discord.js"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
// text
import list from "./list/text"
import remove from "./remove/text"
import add from "./add/text"
// slash
import listSlash from "./list/slash"
import removeSlash from "./remove/slash"
import addSlash from "./add/slash"

const actions: Record<string, Command> = {
  list,
  remove,
  add,
}

const textCmd: Command = {
  id: "alert",
  command: "alert",
  brief: "Alert Configuration",
  category: "Defi",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}alert <action>`,
        examples: `${PREFIX}alert list\n${PREFIX}alert add ftm`,
        description: "Get notifications every time the price change",
        document: `${PRICE_ALERT_GITBOOK}`,
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  colorType: "Defi",
  canRunWithoutAction: false,
}

const slashActions: Record<string, SlashCommand> = {
  list: listSlash,
  remove: removeSlash,
  add: addSlash,
}

const slashCmd: SlashCommand = {
  name: "alert",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("alert")
      .setDescription("Get notifications every time the price change")
    data.addSubcommand(<SlashCommandSubcommandBuilder>listSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>addSlash.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}alert <action>`,
        description: "Get notifications every time the price change",
        examples: `${SLASH_PREFIX}alert list\n${SLASH_PREFIX}alert add ftm`,
        document: `${PRICE_ALERT_GITBOOK}`,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
