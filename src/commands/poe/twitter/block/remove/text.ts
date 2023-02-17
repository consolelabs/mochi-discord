import config from "adapters/config"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"
import { twitterAppClient } from "clients/twitter"
import { APIError, CommandArgumentError, GuildIdNotFoundError } from "errors"

const command: Command = {
  id: "poe_twitter_unblock",
  command: "remove",
  brief: "Remove a twitter user from your server's blacklist",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg: Message) {
    if (!msg.guildId) throw new GuildIdNotFoundError({ message: msg })
    const arg = getCommandArguments(msg)[4]
    const isUsername = arg.startsWith("@")
    const twitterRes = await (isUsername
      ? twitterAppClient.users
          .findUserByUsername(arg.slice(1))
          .catch(() => null)
      : twitterAppClient.users.findUserById(arg).catch(() => null))
    if (!twitterRes || twitterRes.errors || !twitterRes.data) {
      throw new CommandArgumentError({
        message: msg,
        description: "Invalid twitter ID or username",
        getHelpMessage: () => this.getHelpMessage(msg),
      })
    }
    const { ok, log, curl } = await config.removeFromTwitterBlackList({
      guild_id: msg.guildId,
      twitter_id: twitterRes.data.id,
    })
    if (!ok) {
      throw new APIError({ message: msg, curl: curl, description: log })
    }

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            description: `Twitter user \`${twitterRes.data.username}\` has been removed from server's black list`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}poe twitter block remove <twitter ID or username>`,
        examples: `${PREFIX}poe twitter block remove @randomeuser\n${PREFIX}poe twitter block remove 123123123123`,
      }),
    ],
  }),
  colorType: "Server",
  canRunWithoutAction: true,
  minArguments: 5,
}

export default command
