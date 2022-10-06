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
import info from "./info"

const subCommands: Record<string, SlashCommand> = {
  set,
  info,
  remove,
}

const command: SlashCommand = {
  name: "defaultrole",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("defaultrole")
      .setDescription("Default Role Configuration")
    data.addSubcommand(<SlashCommandSubcommandBuilder>set.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>info.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>remove.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return subCommands[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}defaultrole <sub-command>`,
        description:
          "Set a default role that will automatically assigned to newcomers when they first join your server",
        footer: [`Type ${SLASH_PREFIX}help dr <action> for a specific action!`],
      }),
    ],
  }),
  colorType: "Server",
}

export default command
