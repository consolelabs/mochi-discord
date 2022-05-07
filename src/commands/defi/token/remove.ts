import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import Config from "../../../adapters/config"

const command: Command = {
  id: "remove_server_token",
  command: "remove",
  brief: "Remove a token from your server's list",
  onlyAdministrator: true,
  category: "Community",
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
      active: false
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `Successfully removed **${symbol.toUpperCase()}** from server's tokens list`
          })
        ]
      }
    }
  },
  getHelpMessage: async msg => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens remove <symbol>`,
        examples: `${PREFIX}tokens remove ftm`,
        footer: ["Type $tokens to see supported tokens by Mochi"]
      })
    ]
  }),
  canRunWithoutAction: true,
  aliases: ["rm"]
}

export default command
