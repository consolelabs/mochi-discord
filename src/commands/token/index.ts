import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SLASH_PREFIX, TOKEN_GITBOOK } from "utils/constants"
import { thumbnails } from "utils/common"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
// slash
import addSlash from "./add/slash"
import defaultSlash from "./default/slash"
import removeSlash from "./remove/slash"
import infoSlash from "./info/slash"
import listSlash from "./list/slash"

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

export default { slashCmd }
