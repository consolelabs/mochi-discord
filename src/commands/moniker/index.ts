import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
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

export default { slashCmd }
