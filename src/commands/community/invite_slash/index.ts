import { SlashCommand } from "types/common"
import { SLASH_PREFIX, INVITE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import config from "./config"
import info from "./info"
import leaderboard from "./leaderboard"
import link from "./link"
import aggregation from "./aggregation"

import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const subCommands: Record<string, SlashCommand> = {
  info,
  config,
  leaderboard,
  link,
  aggregation,
}

const command: SlashCommand = {
  name: "invite",
  category: "Community",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("invite")
      .setDescription(
        "Track the number of successful invites per server's member"
      )
    data.addSubcommand(<SlashCommandSubcommandBuilder>link.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>info.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>config.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>leaderboard.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>aggregation.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return subCommands[interaction.options.getSubcommand()].run(interaction)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}invite <action>`,
        examples: `${SLASH_PREFIX}invite leaderboard\n${SLASH_PREFIX}inv leaderboard`,
        footer: [`Type ${SLASH_PREFIX}help invite <action> for a specific action!`],
        description:
          "Track the number of successful invites per server's member",
        includeCommandsList: true,
        document: INVITE_GITBOOK,
      }),
    ],
  }),
  colorType: "Command",
}

export default command
