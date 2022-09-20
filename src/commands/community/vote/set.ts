import config from "adapters/config"
import { Guild, Message, User } from "discord.js"
import { APIError, CommandError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "utils/discordEmbed"
import { handle as handleInfo } from "./info"

async function handle(channelId: string, guild: Guild, user: User) {
  const res = await config.setVoteChannel(guild.id, channelId)

  if (!res.ok) {
    throw new APIError({ curl: res.curl, description: res.log, guild, user })
  }
}

const command: Command = {
  id: "vote_set",
  command: "set",
  brief: "Set a specific channel for user to run vote command",
  category: "Community",
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const args = getCommandArguments(msg)
    const { isChannel, id: channelId } = parseDiscordToken(args[2])
    if (!isChannel) {
      throw new CommandError({
        message: msg,
        description: "The argument is not a channel",
      })
    }

    await handle(channelId, msg.guild, msg.author)
    const info = await handleInfo(msg.guild, msg.author)

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
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
}

export default command
