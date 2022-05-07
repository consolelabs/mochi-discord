import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import Config from "../../../adapters/config"

const command: Command = {
  id: "add_server_token",
  command: "add",
  brief: "Add a token to your server's list",
  category: "Community",
  onlyAdministrator: true,
  run: async function(msg) {
    const args = getCommandArguments(msg)
    const symbol = args[2]
    if (!symbol)
      return {
        messageOptions: await this.getHelpMessage(msg)
      }

    await Config.updateTokenConfig({
      guild_id: msg.guildId,
      symbol,
      active: true
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `Successfully added **${symbol.toUpperCase()}** to server's tokens list`
          })
        ]
      }
    }
  },
  getHelpMessage: async msg => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens add <symbol>`,
        examples: `${PREFIX}tokens add ftm`,
        footer: ["Type $tokens to see supported tokens by Mochi"]
      })
    ]
  }),
  canRunWithoutAction: true
}

export default command
