import {
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX, TWITTER_WATCH_GITBOOK } from "utils/constants"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import list from "./list"
import remove from "./remove"
import set from "./set"
import stats from "./stats"

const subCommands: Record<string, SlashCommand> = {
  list,
  remove,
  set,
  stats,
}

const command: SlashCommand = {
  name: "twitter",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandSubcommandGroupBuilder()
      .setName("twitter")
      .setDescription("Configure your server's PoE through twitter")
      .addSubcommand(<SlashCommandSubcommandBuilder>list.prepare())
      .addSubcommand(<SlashCommandSubcommandBuilder>remove.prepare())
      .addSubcommand(<SlashCommandSubcommandBuilder>set.prepare())
      .addSubcommand(<SlashCommandSubcommandBuilder>stats.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return subCommands[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}poe twitter <action>`,
        examples: `${SLASH_PREFIX}poe twitter list`,
        footer: [
          `Type ${SLASH_PREFIX}poe twitter <action> for a specific action!`,
        ],
        description:
          "Forward any tweets that contains a user-specified keyword from Twitter to Discord server",
        document: TWITTER_WATCH_GITBOOK,
        includeCommandsList: true,
        title: "PoE - Twitter tweet watcher",
      }),
    ],
  }),
  colorType: "Server",
}

export default command
