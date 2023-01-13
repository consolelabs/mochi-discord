import { Command, SlashCommand } from "types/common"
import { PREFIX, PRUNE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "discord/embed/ui"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
// text
import inactive from "./inactive/text"
import without from "./without/text"
import safelist from "./whitelist/text"
import remove from "./remove/text"
// slash
import inactiveSlash from "./inactive/slash"
import withoutSlash from "./without/slash"
// import safelistSlash from "./whitelist/slash"
// import removeSlash from "./remove/slash"

const actions: Record<string, Command> = {
  inactive,
  without,
  safelist,
  remove,
}

const textCmd: Command = {
  id: "prune",
  command: "prune",
  brief: "Remove a group of users",
  category: "Community",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}prune <option>`,
        description: "Remove a group of users",
        examples: `${PREFIX}prune inactive 7\n${PREFIX}prune safelist @role1`,
        footer: [`Type ${PREFIX}help prune for a specific action!`],
        document: PRUNE_GITBOOK,
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
  onlyAdministrator: true,
  aliases: ["pr"],
}

const slashActions: Record<string, SlashCommand> = {
  inactive: inactiveSlash,
  without: withoutSlash,
  // safelist: safelistSlash,
  // remove: removeSlash,
}

const slashCmd: SlashCommand = {
  name: "prune",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("prune")
      .setDescription("Prune members")

    data.addSubcommand(<SlashCommandSubcommandBuilder>inactiveSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>withoutSlash.prepare())
    // data.addSubcommand(<SlashCommandSubcommandBuilder>safelistSlash.prepare())
    // data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}prune <option>`,
        footer: [`Type ${SLASH_PREFIX}help prune for a specific action!`],
        includeCommandsList: true,
        originalMsgAuthor: interaction.user,
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
