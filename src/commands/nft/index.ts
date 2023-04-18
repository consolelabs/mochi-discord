import { Command, SlashCommand } from "types/common"
import { NFT_GITBOOK, PREFIX, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
// text
import add from "./add/text"
import integrate from "./integrate/text"
import list from "./list/text"
import query from "./query/text"
import stats from "./stats/text"
import ticker from "./ticker/text"
// slash
import addSlash from "./add/slash"
import integrateSlash from "./integrate/slash"
import statsSlash from "./stats/slash"
import tickerSlash from "./ticker/slash"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const actions: Record<string, Command> = {
  add,
  ticker,
  list,
  stats,
  integrate,
}

const textCmd: Command = {
  id: "NFT",
  command: "nft",
  brief: "NFT",
  category: "Community",
  run: async (msg) => query.run(msg),
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
  // integrate: integrateSlash,
  stats: statsSlash,
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
    data.addSubcommand(<SlashCommandSubcommandBuilder>integrateSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>statsSlash.prepare())
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
