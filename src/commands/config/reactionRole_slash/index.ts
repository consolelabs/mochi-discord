import { SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX, REACTION_ROLE_GITBOOK } from "utils/constants"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import list from "./list"
import set from "./set"
import remove from "./remove"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const subCommands: Record<string, SlashCommand> = {
  set,
  list,
  remove,
}

const command: SlashCommand = {
  name: "reactionrole",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("reactionrole")
      .setDescription("Reaction Role Configuration")
    data.addSubcommand(<SlashCommandSubcommandBuilder>set.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>list.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>remove.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return subCommands[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}reactionrole <action>`,
        examples: `${PREFIX}reactionrole list\n${PREFIX}rr list\n${PREFIX}reactionrole set https://discord.com/channels/...4875 ✅ @Visitor`,
        description: "Assign a role corresponding to users' reaction",
        footer: [
          `Type ${PREFIX}help reactionrole <action> for a specific action!`,
        ],
        document: REACTION_ROLE_GITBOOK,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
