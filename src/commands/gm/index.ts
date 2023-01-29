import { Command, SlashCommand } from "types/common"
import { GM_GITBOOK, PREFIX, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
// text
import set from "./set/text"
import info from "./info/text"
import streak from "./streak/text"
//slash
import setSlash from "./set/slash"
import infoSlash from "./info/slash"
import streakSlash from "./streak/slash"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const actions: Record<string, Command> = {
  set,
  streak,
  info,
}

const textCmd: Command = {
  id: "gm",
  command: "gm",
  brief: "GM/GN",
  category: "Community",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}gm <action>`,
        examples: `${PREFIX}gm streak\n${PREFIX}gm set #general`,
        footer: [`Type ${PREFIX}help gm <action> for a specific action!`],
        description:
          "Configure a good morning/good night channel for users to engage and keep streaks",
        includeCommandsList: true,
        document: GM_GITBOOK,
      }),
    ],
  }),
  aliases: ["gn"],
  actions,
  colorType: "Command",
  canRunWithoutAction: false,
}

const slashActions: Record<string, SlashCommand> = {
  info: infoSlash,
  set: setSlash,
  streak: streakSlash,
}

const slashCmd: SlashCommand = {
  name: "gm",
  category: "Community",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("gm")
      .setDescription(
        "Configure a good morning/good night channel for users to engage and keep streaks"
      )

    data.addSubcommand(<SlashCommandSubcommandBuilder>infoSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>setSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>streakSlash.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}gm <action>`,
        examples: `${SLASH_PREFIX}gm streak\n${SLASH_PREFIX}gm set #general`,
        footer: [`Type ${SLASH_PREFIX}help gm <action> for a specific action!`],
        description:
          "Configure a good morning/good night channel for users to engage and keep streaks",
        includeCommandsList: true,
        document: GM_GITBOOK,
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
