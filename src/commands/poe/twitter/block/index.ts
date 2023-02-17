import config from "adapters/config"
import { Command } from "types/common"
import { PREFIX, TWITTER_PROFILE_REGEX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"
import { twitterAppClient } from "clients/twitter"
import list from "./list/text"
import remove from "./remove/text"
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
    const link = args[3]
    if (!link)
      throw new CommandArgumentError({
        message: msg,
        description: "Please specify a twitter handle",
        getHelpMessage: () => this.getHelpMessage(msg),
      })
    const handle = TWITTER_PROFILE_REGEX.exec(link)?.at(2)
    if (!handle) {
      throw new CommandArgumentError({
        message: msg,
        description: "Invalid twitter profile url",
        getHelpMessage: async () => ({
          embeds: [
            getErrorEmbed({
              title: "No twitter account found",
              description:
                "Make sure that the account exists, or that you have entered it correctly.",
            }),
          ],
        }),
      })
    }
    const twitterData: Record<"id" | "username", string | undefined> = {
      id: "",
      username: "",
    }
    try {
      const twitterRes = await twitterAppClient.users.findUserByUsername(handle)
      twitterData.id = twitterRes.data?.id
      twitterData.username = twitterRes.data?.username
    } catch (e) {
      throw new CommandArgumentError({
        message: msg,
        description: "Invalid username",
        getHelpMessage: () => this.getHelpMessage(msg),
      })
    }
    if (!twitterData.id || !twitterData.username) {
      throw new CommandArgumentError({
        message: msg,
        description: "Invalid username",
        getHelpMessage: () => this.getHelpMessage(msg),
      })
    }
    const { ok, log, curl } = await config.addToTwitterBlackList({
      guild_id: msg.guildId,
      twitter_id: twitterData.id,
      twitter_username: twitterData.username,
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
            description: `Twitter user \`${twitterData.username}\` has been added to server's black list`,
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
          usage: `${PREFIX}poe twitter block <twitter profile link>\n${PREFIX}poe twitter block <action>`,
          examples: `${PREFIX}poe twitter block https://twitter.com/vincentzepanda\n${PREFIX}poe twitter block list`,
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
