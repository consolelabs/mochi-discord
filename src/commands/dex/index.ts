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
import infoSlash from "./info/slash"

const actions: Record<string, Command> = {
  info: infoSlash,
}

const textCmd: Command = {
  id: "dex",
  command: "dex",
  brief: "Dex information",
  category: "Defi",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        description: "Dex information",
        usage: `${PREFIX}dex`,
        examples: `${PREFIX}dex info`,
        document: TOKEN_GITBOOK,
        footer: [`Type ${PREFIX}help dex <action> for a specific action!`],
        includeCommandsList: true,
      }),
    ],
  }),
  canRunWithoutAction: false,
  aliases: ["dex"],
  actions,
  colorType: "Defi",
}

// slash
const subCommands: Record<string, SlashCommand> = {
  info: infoSlash,
}

const slashCmd: SlashCommand = {
  name: "dex",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("dex")
      .setDescription("Dex information")

    data.addSubcommand(<SlashCommandSubcommandBuilder>infoSlash.prepare())
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
        usage: `${SLASH_PREFIX}dex`,
        examples: `${SLASH_PREFIX}dex info`,
        document: TOKEN_GITBOOK,
        footer: [
          `Type ${SLASH_PREFIX}help dex <action> for a specific action!`,
        ],
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
