import { Command, SlashCommand } from "types/common"
import { PREFIX, REACTION_ROLE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
// text
import list from "./list/text"
import set from "./set/text"
import remove from "./remove/text"
// slash
import listSlash from "./list/slash"
import setSlash from "./set/slash"
import removeSlash from "./remove/slash"
import { getEmoji } from "utils/common"
import { CommandInteraction } from "discord.js"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"

const actions: Record<string, Command> = {
  list,
  set,
  remove,
}

const textCmd: Command = {
  id: "reactionrole",
  command: "reactionrole",
  brief: "Reaction Role Configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  featured: {
    title: `${getEmoji("")} Reaction role`,
    description: "Assign a role corresponding to users' reaction",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}rr <action>`,
        examples: `${PREFIX}reactionrole list\n${PREFIX}rr list\n${PREFIX}reactionrole set https://discord.com/channels/...4875 ✅ @Visitor`,
        description: `Assign a role corresponding to users' reaction\n\n*Note:\n${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} When setting a new reaction role, please use the **custom emoji from this server** and the **Discord default emoji**.* ${getEmoji(
          "nekosad"
        )}`,
        footer: [`Type ${PREFIX}help rr <action> for a specific action!`],
        document: REACTION_ROLE_GITBOOK,
        includeCommandsList: true,
      }),
    ],
  }),
  aliases: ["rr"],
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

const slashActions: Record<string, SlashCommand> = {
  set: setSlash,
  list: listSlash,
  remove: removeSlash,
}

const slashCmd: SlashCommand = {
  name: "reactionrole",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("reactionrole")
      .setDescription("Reaction Role Configuration")
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
        usage: `${SLASH_PREFIX}reactionrole <action>`,
        examples: `${SLASH_PREFIX}reactionrole list\n${SLASH_PREFIX}rr list\n${SLASH_PREFIX}reactionrole set https://discord.com/channels/...4875 ✅ @Visitor`,
        description: "Assign a role corresponding to users' reaction",
        footer: [
          `Type ${SLASH_PREFIX}help reactionrole <action> for a specific action!`,
        ],
        document: REACTION_ROLE_GITBOOK,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
