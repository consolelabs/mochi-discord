import { Command, SlashCommand } from "types/common"
// text
import set from "./set/text"
import list from "./list/text"
// slash
import setSlash from "./set/slash"
import listSlash from "./list/slash"
import { getEmoji } from "utils/common"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { PREFIX, TOKEN_ROLE_GITBOOK } from "utils/constants"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const actions: Record<string, Command> = {
  set,
  list,
}

const textCmd: Command = {
  id: "tokenrole",
  command: "tokenrole",
  brief: "Token Role configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  featured: {
    title: `${getEmoji("")} Token role`,
    description:
      "Assign role to a user once they hold a certain amount of Token",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tr <action>\n${PREFIX}tokenrole <action>`,
        description:
          " Assign role to a user once they hold a certain amount of Token",
        examples: `${PREFIX}tr list\n${PREFIX}tokenrole list\n${PREFIX}tokenrole set @Mochi 1 0x4E15361FD6b4BB609Fa63C81A2be19d873717870 eth`,
        footer: [`Type ${PREFIX}help tr <action> for a specific action!`],
        includeCommandsList: true,
        document: TOKEN_ROLE_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["tr"],
  actions,
  colorType: "Server",
  minArguments: 5,
}

const slashActions: Record<string, SlashCommand> = {
  set: setSlash,
  list: listSlash,
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

export default { textCmd, slashCmd }
