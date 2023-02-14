import { Command, SlashCommand } from "types/common"
// text
import set from "./set/text"
import list from "./list/text"
import remove from "./remove/text"
// slash
import setSlash from "./set/slash"
import listSlash from "./list/slash"
import removeSlash from "./remove/slash"
import { getEmoji } from "utils/common"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { PREFIX, MIX_ROLE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const actions: Record<string, Command> = {
  set,
  list,
  remove,
}

const textCmd: Command = {
  id: "mixrole",
  command: "mixrole",
  brief: "Mix Role configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  featured: {
    title: `${getEmoji("")} Mix role`,
    description:
      "Users can combine different thresholds (XP/level, NFT and Token) to assign a role.",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}mr <action>\n${PREFIX}mixrole <action>`,
        description:
          "Users can combine different thresholds (XP/level, NFT and Token) to assign a role.",
        examples: `${PREFIX}mr list\n${PREFIX}mixrole list\n${PREFIX}mixrole set`,
        footer: [`Type ${PREFIX}help mr <action> for a specific action!`],
        includeCommandsList: true,
        document: MIX_ROLE_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["mr"],
  actions,
  colorType: "Server",
  minArguments: 2,
}

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

export default { textCmd, slashCmd }
