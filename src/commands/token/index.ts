import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX, SLASH_PREFIX, TOKEN_GITBOOK } from "utils/constants"
import { thumbnails } from "utils/common"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
// text
import add from "./add/text"
import _default from "./default/text"
import remove from "./remove/text"
import info from "./info/text"
import list from "./list/text"
// slash
import addSlash from "./add/slash"
import defaultSlash from "./default/slash"
import removeSlash from "./remove/slash"
import infoSlash from "./info/slash"
import listSlash from "./list/slash"

const actions: Record<string, Command> = {
  add,
  default: _default,
  info,
  list,
  remove,
}

const textCmd: Command = {
  id: "tokens",
  command: "tokens",
  brief: "Show all supported tokens by Mochi",
  category: "Defi",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        description: "Manage all supported tokens by Mochi",
        usage: `${PREFIX}tokens`,
        examples: `${PREFIX}token list`,
        document: TOKEN_GITBOOK,
        footer: [`Type ${PREFIX}help token <action> for a specific action!`],
        includeCommandsList: true,
      }),
    ],
  }),
  canRunWithoutAction: false,
  aliases: ["token"],
  actions,
  colorType: "Defi",
}

// slash
const subCommands: Record<string, SlashCommand> = {
  add: addSlash,
  default: defaultSlash,
  info: infoSlash,
  list: listSlash,
  remove: removeSlash,
}

const slashCmd: SlashCommand = {
  name: "token",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("token")
      .setDescription("Show all supported tokens by Mochi.")

    data.addSubcommand(<SlashCommandSubcommandBuilder>addSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>defaultSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>infoSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>listSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return subCommands[interaction.options.getSubcommand()].run(interaction)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: thumbnails.TOKENS,
        description: "Manage all supported tokens by Mochi",
        usage: `${SLASH_PREFIX}tokens`,
        examples: `${SLASH_PREFIX}tokens list\n${SLASH_PREFIX}token list`,
        document: TOKEN_GITBOOK,
        footer: [
          `Type ${SLASH_PREFIX}help token <action> for a specific action!`,
        ],
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
