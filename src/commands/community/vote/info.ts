import config from "adapters/config"
import { Guild, Message, User } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { PREFIX, VOTE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

export async function handle(guild: Guild, user: User) {
  const res = await config.getVoteChannel(guild.id)
  if (!res.ok) {
    throw new APIError({ curl: res.curl, description: res.log, guild, user })
  }

  return res.data
}

const command: Command = {
  id: "vote_info",
  command: "info",
  brief: "Show this server's configured vote channel",
  category: "Community",
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const info = await handle(msg.guild, msg.author)

    if (!info) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "Vote channel",
              description: `No voting channel configured for this guild.\nSet one with \`${PREFIX}vote set <channel>.\``,
            }),
          ],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Vote channel",
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
        document: VOTE_GITBOOK,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
}

export default command
