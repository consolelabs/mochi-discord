import { SlashCommand } from "types/common"
// slash
import setSlash from "./set/slash"
import listSlash from "./list/slash"
import removeSlash from "./remove/slash"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { PREFIX, TOKEN_ROLE_GITBOOK } from "utils/constants"
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
  name: "tokenrole",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("tokenrole")
      .setDescription("Token Role configuration")
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
        usage: `${PREFIX}tokenrole <action>\n${PREFIX}tokenrole <action>`,
        description:
          " Assign role to a user once they hold a certain amount of Token",
        examples: `${PREFIX}tr list\n${PREFIX}tokenrole list\n${PREFIX}tokenrole set @Mochi 1 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73 eth`,
        footer: [
          `Type ${PREFIX}help tokenrole <action> for a specific action!`,
        ],
        includeCommandsList: true,
        document: TOKEN_ROLE_GITBOOK,
      }),
    ],
  }),
  colorType: "Server",
}

export default { slashCmd }
