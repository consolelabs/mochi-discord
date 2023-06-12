import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"
// slash
import setSlash from "./set/slash"
import listSlash from "./list/slash"
import removeSlash from "./remove/slash"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

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

export default { slashCmd }
