import { SlashCommand } from "types/common"
import list from "./list"
import set from "./set"
import remove from "./remove"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

const subCommands: Record<string, SlashCommand> = {
  set,
  list,
  remove,
}

const command: SlashCommand = {
  name: "monikers",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("monikers")
      .setDescription("Moniker configuration")
    data.addSubcommand(<SlashCommandSubcommandBuilder>set.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>list.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>remove.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return subCommands[interaction.options.getSubcommand()].run(interaction)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${PREFIX}monikers <action>`,
        examples: `${PREFIX}monikers list`,
        description: "Manage monikers configuration used in tip",
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
