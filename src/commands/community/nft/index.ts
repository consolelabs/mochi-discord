import { Command } from "types/common"
import { NFT_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import add from "./add"
import ticker from "./ticker"
import volume from "./top"
import list from "./list"
import recent from "./recent"
import query from "./query"
import stats from "./stats"
import config from "./config"
import integrate from "./integrate"

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

const command: Command = {
  id: "nft",
  command: "nft",
  brief: "NFT",
  category: "Community",
  run: async (msg) => query.run(msg),
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft <collection_symbol> <token_id>\n${PREFIX}nft <action>`,
        footer: [`Type ${PREFIX}help nft <action> for a specific action!`],
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

export default command
