import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import set from "./set"
import remove from "./remove"
import list from "./list"

const subCommands: Record<string, SlashCommand> = {
  set,
  list,
  remove,
}

const command: SlashCommand = {
  name: "levelrole",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("levelrole")
      .setDescription("Level-role configuration")
    data.addSubcommand(<SlashCommandSubcommandBuilder>set.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>list.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>remove.prepare())
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

export default command
