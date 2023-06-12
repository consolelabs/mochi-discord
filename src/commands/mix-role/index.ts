import { SlashCommand } from "types/common"
// slash
import setSlash from "./set/slash"
import listSlash from "./list/slash"
import removeSlash from "./remove/slash"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { MIX_ROLE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const slashActions: Record<string, SlashCommand> = {
  set: setSlash,
  list: listSlash,
  remove: removeSlash,
}

const slashCmd: SlashCommand = {
  name: "mixrole",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("mixrole")
      .setDescription("Mix Role configuration")
    data.addSubcommand(<SlashCommandSubcommandBuilder>setSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>listSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}mixrole <action>\n${SLASH_PREFIX}mixrole <action>`,
        description:
          "Users can combine different thresholds (XP/level, NFT and Token) to assign a role.",
        examples: `${SLASH_PREFIX}mr list\n${SLASH_PREFIX}mixrole list\n${SLASH_PREFIX}mixrole set`,
        footer: [
          `Type ${SLASH_PREFIX}help mixrole <action> for a specific action!`,
        ],
        includeCommandsList: true,
        document: MIX_ROLE_GITBOOK,
      }),
    ],
  }),
  colorType: "Server",
}

export default { slashCmd }
