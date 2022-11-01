import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { NFT_ROLE_GITBOOK, SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import list from "./list"
import remove from "./remove"
import set from "./set"

const subCommands: Record<string, SlashCommand> = {
  set,
  list,
  remove,
}

const command: SlashCommand = {
  name: "nftrole",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("nftrole")
      .setDescription("NFT Role configuration")
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
        usage: `${PREFIX}nftrole <action>\n${PREFIX}nftrole <action>`,
        description:
          "Asssign role to a user once they hold a certain amount of NFT\nSupports multiple collections and grouping",
        examples: `${PREFIX}nftrole list\n${PREFIX}nftrole list`,
        footer: [`Type ${PREFIX}help nftrole <action> for a specific action!`],
        includeCommandsList: true,
        document: NFT_ROLE_GITBOOK,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
