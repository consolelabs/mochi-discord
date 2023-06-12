import { SlashCommand } from "types/common"
import { NFT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { CommandInteraction } from "discord.js"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
// slash
import listSlash from "./list/slash"
import removeSlash from "./remove/slash"
import setSlash from "./set/slash"

const slashActions: Record<string, SlashCommand> = {
  list: listSlash,
  remove: removeSlash,
  set: setSlash,
}

const slashCmd: SlashCommand = {
  name: "nftrole",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("nftrole")
      .setDescription("NFT Role configuration")
    data.addSubcommand(<SlashCommandSubcommandBuilder>listSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>setSlash.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}nftrole <action>\n${PREFIX}nftrole <action>`,
        description:
          "Asssign role to a user once they hold a certain amount of NFT\nSupports multiple collections and grouping",
        examples: `${PREFIX}nr list\n${PREFIX}nftrole list\n${PREFIX}nftrole set @Mochi 1 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73`,
        footer: [`Type ${PREFIX}help nftrole <action> for a specific action!`],
        includeCommandsList: true,
        document: NFT_ROLE_GITBOOK,
      }),
    ],
  }),
  colorType: "Server",
}

export default { slashCmd }
