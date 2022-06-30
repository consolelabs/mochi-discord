import { Command } from "types/common"
import { getAllAliases } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import add from "./add"
import ticker from "./ticker"
import volume from "./top"
import list from "./list"
import newListed from "./newListed"
import query from "./query"

const actions: Record<string, Command> = {
  add,
  volume,
  ticker,
  list,
  newListed,
}
const commands: Record<string, Command> = getAllAliases(actions)

const command: Command = {
  id: "nft",
  command: "nft",
  brief: "NFT",
  category: "Community",
  run: async function (msg, action) {
    const actionObj = commands[action]
    return (actionObj ?? query).run(msg)
  },
  getHelpMessage: async (msg, action) => {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.getHelpMessage(msg)
    }
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}nft <collection_symbol> <token_id>\n${PREFIX}nft <action>`,
          footer: [`Type ${PREFIX}help nft <action> for a specific action!`],
          includeCommandsList: true,
        }),
      ],
    }
  },
  actions,
  colorType: "Market",
}

export default command
