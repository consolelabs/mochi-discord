import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
// slash
import infoSlash from "./info/slash"
import removeSlash from "./remove/slash"
import setSlash from "./set/slash"

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

export default { slashCmd }
