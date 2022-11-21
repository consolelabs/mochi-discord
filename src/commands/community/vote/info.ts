import config from "adapters/config"
import { Message } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { PREFIX, VOTE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

export async function handle(guildId: string, message: Message) {
  const res = await config.getVoteChannel(guildId)
  if (!res.ok) {
    throw new APIError({ message, curl: res.curl, description: res.log })
  }

  return res.data
}

const command: Command = {
  id: "vote_info",
  command: "info",
  brief: "Show this server's configured vote channel",
  category: "Community",
  run: async (msg: Message) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const info = await handle(msg.guildId, msg)

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
        document: `${VOTE_GITBOOK}&action=info`,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
}

export default command
