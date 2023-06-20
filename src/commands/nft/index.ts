import { Command, SlashCommand } from "types/common"
import { NFT_GITBOOK, PREFIX, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
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

export default { slashCmd }
