import { Command, SlashCommand } from "types/common"
import { NFT_GITBOOK, PREFIX, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "discord/embed/ui"
import { getEmoji } from "utils/common"
// text
import add from "./add/text"
import config from "./config/text"
import integrate from "./integrate/text"
import list from "./list/text"
import query from "./query/text"
import recent from "./recent/text"
import stats from "./stats/text"
import ticker from "./ticker/text"
import volume from "./volume/text"
// slash
import addSlash from "./add/slash"
import configSlash from "./config/slash"
import integrateSlash from "./integrate/slash"
// import listSlash from "./list/slash"
// import querySlash from "./query/slash"
import recentSlash from "./recent/slash"
import statsSlash from "./stats/slash"
import tickerSlash from "./ticker/slash"
import volumeSlash from "./volume/slash"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const actions: Record<string, Command> = {
  add,
  volume,
  ticker,
  list,
  recent,
  stats,
  config,
  integrate,
}

const textCmd: Command = {
  id: "NFT",
  command: "nft",
  brief: "NFT",
  category: "Community",
  run: async (msg) => query.run(msg),
  featured: {
    title: `${getEmoji("nfts")} NFT`,
    description:
      "Show NFT rarity checker in real-time, including volume, ticker, and sales",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft <collection_symbol> <token_id>\n${PREFIX}nft <action>`,
        footer: [`Type ${PREFIX}help nft <action> for a specific action!`],
        description:
          "Show NFT rarity checker in real-time, including volume, ticker, and sales",
        examples: `${PREFIX}nft list\n${PREFIX}nft MUTCATS 1\n${PREFIX}mochi bayc 1`,
        document: NFT_GITBOOK,
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  colorType: "Market",
  minArguments: 3,
  canRunWithoutAction: true,
  aliases: ["mochi"],
}

const slashActions: Record<string, SlashCommand> = {
  add: addSlash,
  "config_twitter-sale": configSlash,
  integrate: integrateSlash,
  stats: statsSlash,
  recent: recentSlash,
  volume: volumeSlash,
  ticker: tickerSlash,
}

const slashCmd: SlashCommand = {
  name: "nft",
  category: "Community",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("nft")
      .setDescription(
        "Show NFT rarity checker in real-time, including volume, ticker, and sales"
      )

    data.addSubcommand(<SlashCommandSubcommandBuilder>addSlash.prepare())
    data.addSubcommandGroup(
      <SlashCommandSubcommandGroupBuilder>configSlash.prepare()
    )
    data.addSubcommand(<SlashCommandSubcommandBuilder>integrateSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>statsSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>recentSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>volumeSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>tickerSlash.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}nft <collection_symbol> <token_id>\n${SLASH_PREFIX}nft <action>`,
        footer: [
          `Type ${SLASH_PREFIX}help nft <action> for a specific action!`,
        ],
        description:
          "Show NFT rarity checker in real-time, including volume, ticker, and sales",
        examples: `${SLASH_PREFIX}nft list\n${SLASH_PREFIX}nft MUTCATS 1\n${SLASH_PREFIX}mochi bayc 1`,
        document: NFT_GITBOOK,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
}

export default { textCmd, slashCmd }
