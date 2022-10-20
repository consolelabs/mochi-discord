import config from "adapters/config"
import { Message, User } from "discord.js"
import { APIError, CommandError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "utils/discordEmbed"
import { handle as handleInfo } from "./info"

async function handle(channelId: string, guildId: string, user: User) {
  const res = await config.setJoinLeaveChannel(guildId, channelId)

  if (!res.ok) {
    throw new APIError({ curl: res.curl, description: res.log, user })
  }
}

const command: Command = {
  id: "joinleave_set",
  command: "set",
  brief: "Set a specific channel to log members joining and leaving",
  category: "Config",
  run: async (msg: Message) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const args = getCommandArguments(msg)
    const { isChannel, value: channelId } = parseDiscordToken(args[2])
    if (!isChannel) {
      throw new CommandError({
        message: msg,
        description: "The argument is not a channel",
      })
    }

    await handle(channelId, msg.guildId, msg.author)
    const info = await handleInfo(msg.guildId, msg.author)

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: "Successfully set!",
            description: `<#${info.channel_id}> is currently set.\nTo change channel, run \`${PREFIX}joinleave set <channel>.\``,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}joinleave set <channel>`,
        examples: `${PREFIX}joinleave set #general`,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
}

export default command
