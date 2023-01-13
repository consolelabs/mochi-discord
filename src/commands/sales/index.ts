import { Command, SlashCommand } from "types/common"
import { PREFIX, SALE_TRACKER_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
// text
import list from "./list/text"
import remove from "./remove/text"
import track from "./track/text"
// slash
import listSlash from "./list/slash"
import removeSlash from "./remove/slash"
import trackSlash from "./track/slash"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const actions: Record<string, Command> = {
  track,
  list,
  remove,
}

const textCmd: Command = {
  id: "sales",
  command: "sales",
  brief: "NFT sales tracker",
  category: "Community",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}sales <action>`,
        description: "Receive real-time notification whenever there is a sale",
        examples: `${PREFIX}sales list\n${PREFIX}sale list\n${PREFIX}sales track #general 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73 250`,
        footer: [`Type ${PREFIX}help sales <action> for a specific action!`],
        document: SALE_TRACKER_GITBOOK,
        includeCommandsList: true,
      }),
    ],
  }),
  onlyAdministrator: true,
  actions,
  colorType: "Marketplace",
  canRunWithoutAction: false,
  aliases: ["sale"],
}

const subCommands: Record<string, SlashCommand> = {
  list: listSlash,
  remove: removeSlash,
  track: trackSlash,
}

const slashCmd: SlashCommand = {
  name: "sales",
  category: "Community",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("sales")
      .setDescription("NFT sales tracker")
    data.addSubcommand(<SlashCommandSubcommandBuilder>listSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>trackSlash.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return subCommands[interaction.options.getSubcommand()].run(interaction)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}sales <action>`,
        description: "Receive real-time notification whenever there is a sale",
        examples: `${SLASH_PREFIX}sales list\n${SLASH_PREFIX}sale list\n${SLASH_PREFIX}sales track #general 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73 250`,
        footer: [
          `Type ${SLASH_PREFIX}help sales <action> for a specific action!`,
        ],
        document: SALE_TRACKER_GITBOOK,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Marketplace",
}

export default { textCmd, slashCmd }
