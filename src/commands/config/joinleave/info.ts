import config from "adapters/config"
import { Message, User } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

export async function handle(guildId: string, user: User) {
  const res = await config.getJoinLeaveChannel(guildId)
  if (!res.ok) {
    throw new APIError({ curl: res.curl, description: res.log, user })
  }

  return res.data
}

const command: Command = {
  id: "join-leave_info",
  command: "info",
  brief: "Show this server's configured join-leave channel",
  category: "Community",
  run: async (msg: Message) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const info = await handle(msg.guildId, msg.author)

    if (!info) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "Join-Leave channel",
              description: `No join-leave channel configured for this guild.\nSet one with \`${PREFIX}join-leave set <channel>.\``,
            }),
          ],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Join-Leave channel",
            description: `<#${info.channel_id}> is currently set.\nTo change channel, run \`${PREFIX}join-leave set <channel>.\``,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}join-leave set <channel>`,
        examples: `${PREFIX}join-leave set #vote`,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
}

export default command
