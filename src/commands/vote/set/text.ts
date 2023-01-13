import { Message } from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { PREFIX, VOTE_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "discord/embed/ui"
import { handleInfo } from "../processor"
import { handle } from "./processor"

const command: Command = {
  id: "vote_set",
  command: "set",
  brief: "Set a specific channel for user to run vote command",
  category: "Community",
  run: async (msg: Message) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const args = getCommandArguments(msg)
    const { isChannel, value: channelId } = parseDiscordToken(args[2])
    if (!isChannel) {
      throw new InternalError({
        message: msg,
        description: "The argument is not a channel",
      })
    }

    await handle(channelId, msg)
    const info = await handleInfo(msg.guildId, msg)

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: "Successfully set!",
            description: `<#${info.channel_id}> is currently set.\nTo change channel, run \`${PREFIX}vote set <channel>.\``,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}vote set <channel>`,
        examples: `${PREFIX}vote set #vote`,
        includeCommandsList: true,
        document: `${VOTE_GITBOOK}&action=set`,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
}

export default command
