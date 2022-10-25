import config from "adapters/config"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "utils/discordEmbed"
import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"
import { twitter } from "utils/twitter-api"
import list from "./list"
import remove from "./remove"
import { APIError, CommandArgumentError, GuildIdNotFoundError } from "errors"

const actions: Record<string, Command> = {
  list,
  remove,
}

const command: Command = {
  id: "poe_twitter_block",
  command: "block",
  brief: "Block a user from twitter watching list",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    const action = actions[args[3]]
    if (action) return action.run(msg)

    if (!msg.guildId) throw new GuildIdNotFoundError({ message: msg })
    const arg = getCommandArguments(msg)[3]
    const isUsername = arg.startsWith("@")
    const twitterRes = await (isUsername
      ? twitter.users.findUserByUsername(arg.slice(1))
      : twitter.users.findUserById(arg))
    if (twitterRes.errors || !twitterRes.data) {
      throw new CommandArgumentError({
        message: msg,
        user: msg.author,
        guild: msg.guild,
        description: "Invalid twitter ID or username",
        getHelpMessage: () => this.getHelpMessage(msg),
      })
    }
    const { ok, log, curl } = await config.addToTwitterBlackList({
      guild_id: msg.guildId,
      twitter_id: twitterRes.data.id,
      twitter_username: twitterRes.data.username,
      created_by: msg.author.id,
    })
    if (!ok) {
      throw new APIError({ message: msg, curl: curl, description: log })
    }

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            description: `Twitter user \`${twitterRes.data.username}\` has been added to server's black list`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    const args = getCommandArguments(msg)
    const action = actions[args[4]]
    if (action) return action.getHelpMessage(msg)
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}poe twitter block <twitter ID or username>\n${PREFIX}poe twitter block <action>`,
          examples: `${PREFIX}poe twitter block @randomeuser\n${PREFIX}poe twitter block 123123123123\n${PREFIX}poe twitter block list`,
          footer: [`Type ${PREFIX}help poe twitter block`],
          includeCommandsList: true,
          actions,
        }),
      ],
    }
  },
  colorType: "Server",
  canRunWithoutAction: true,
  minArguments: 4,
  actions,
}

export default command
