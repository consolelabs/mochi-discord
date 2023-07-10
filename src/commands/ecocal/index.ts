import { SlashCommand } from "types/common"
import { thumbnails } from "utils/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
// slash
import viewSlash from "./view/slash"

const slashActions: Record<string, SlashCommand> = {
  view: viewSlash,
}

const slashCmd: SlashCommand = {
  name: "ecocal",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("ecocal")
      .setDescription("Show list of your favorite tokens/nfts.")
    data.addSubcommand(<SlashCommandSubcommandBuilder>viewSlash.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        thumbnail: thumbnails.TOKENS,
        title: "Manage your ecocal",
        usage: `${PREFIX}ecocal <sub-command>`,
        examples: `${PREFIX}ecocal view\n${PREFIX}ecocal add eth\n${PREFIX}ecocal view`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default { slashCmd }
