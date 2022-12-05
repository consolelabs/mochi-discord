import { SlashCommand } from "types/common"
import { SLASH_PREFIX, TOKEN_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import add from "../token_slash/add"
import remove from "../token_slash/remove"
import list from "../token_slash/list"
import defaultCmd from "../token_slash/default"
import addCustom from "../token_slash/addCustom"
import info from "../token_slash/info"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { thumbnails } from "utils/common"

const subCommands: Record<string, SlashCommand> = {
  add,
  "add-custom": addCustom,
  info,
  default: defaultCmd,
  list,
  remove,
}

const command: SlashCommand = {
  name: "token",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("token")
      .setDescription("Show all supported tokens by Mochi.")

    data.addSubcommand(<SlashCommandSubcommandBuilder>add.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>addCustom.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>info.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>defaultCmd.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>list.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>remove.prepare())
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
        examples: `${SLASH_PREFIX}tokens list\n${SLASH_PREFIX}token list\n${SLASH_PREFIX}tokens add-custom 0x22c36BfdCef207F9c0CC941936eff94D4246d14A BACC eth`,
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

export default command
