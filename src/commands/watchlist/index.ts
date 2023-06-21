import { SlashCommand } from "types/common"
import { thumbnails } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import CacheManager from "cache/node-cache"
// slash
import addSlash from "./add/slash"
import addNFTSlash from "./add-nft/slash"
import removeSlash from "./remove/slash"
import removeNFTSlash from "./remove-nft/slash"
import viewSlash from "./view/slash"

CacheManager.init({
  ttl: 0,
  pool: "watchlist",
  checkperiod: 1,
})

const slashActions: Record<string, SlashCommand> = {
  view: viewSlash,
  add: addSlash,
  "add-nft": addNFTSlash,
  remove: removeSlash,
  "remove-nft": removeNFTSlash,
}

const slashCmd: SlashCommand = {
  name: "watchlist",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("watchlist")
      .setDescription("Show list of your favorite tokens/nfts.")
    data.addSubcommand(<SlashCommandSubcommandBuilder>viewSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>addSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>addNFTSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>removeNFTSlash.prepare())
    return data
  },
  run: (interaction: CommandInteraction) => {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        thumbnail: thumbnails.TOKENS,
        title: "Manage your watchlist",
        usage: `${PREFIX}watchlist <sub-command>`,
        examples: `${PREFIX}wl view\n${PREFIX}watchlist add eth\n${PREFIX}watchlist add-nft neko`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default { slashCmd }
