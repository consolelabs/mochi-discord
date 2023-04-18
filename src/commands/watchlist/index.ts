import { Command, SlashCommand } from "types/common"
import { thumbnails } from "utils/common"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { PREFIX, WATCHLIST_GITBOOK } from "utils/constants"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import CacheManager from "cache/node-cache"
// text
import add from "./add/text"
import addNFT from "./add-nft/text"
import remove from "./remove/text"
import removeNFT from "./remove-nft/text"
import view from "./view/text"
// slash
import addSlash from "./add/slash"
import addNFTSlash from "./add-nft/slash"
import removeSlash from "./remove/slash"
import removeNFTSlash from "./remove-nft/slash"
import viewSlash from "./view/slash"
import { getCommandArguments } from "utils/commands"

CacheManager.init({
  ttl: 0,
  pool: "watchlist",
  checkperiod: 1,
})

const actions: Record<string, Command> = {
  view,
  add,
  "add-nft": addNFT,
  remove,
  "remove-nft": removeNFT,
}

const textCmd: Command = {
  id: "watchlist",
  command: "watchlist",
  brief: "Watchlist",
  category: "Defi",
  run: async function (msg, ...rest) {
    const [actionAlias] = getCommandArguments(msg)
    switch (actionAlias) {
      case "wlv":
        return actions.view.run(msg, ...rest)
      default:
        return {
          messageOptions: await this.getHelpMessage(msg, ...rest),
        }
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Manage your watchlist",
        description: "Manage your watchlist for selected tokens/nfts",
        usage: `${PREFIX}watchlist <action>`,
        examples: `${PREFIX}wl view\n${PREFIX}watchlist add eth\n${PREFIX}watchlist add-nft neko`,
        document: WATCHLIST_GITBOOK,
        footer: [
          `Type ${PREFIX}help watchlist <action> for a specific action!.`,
        ],
        includeCommandsList: true,
      }),
    ],
  }),
  canRunWithoutAction: true,
  minArguments: 1,
  allowDM: true,
  colorType: "Defi",
  actions,
  aliases: ["wl", "wlv"],
}

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
      composeEmbedMessage2(interaction, {
        thumbnail: thumbnails.TOKENS,
        title: "Manage your watchlist",
        usage: `${PREFIX}watchlist <sub-command>`,
        examples: `${PREFIX}wl view\n${PREFIX}watchlist add eth\n${PREFIX}watchlist add-nft neko`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
