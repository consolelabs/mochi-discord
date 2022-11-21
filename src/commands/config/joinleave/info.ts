import config from "adapters/config"
import { Message } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

export async function handle(guildId: string, message: Message) {
  const res = await config.getJoinLeaveChannel(guildId)
  if (!res.ok) {
    throw new APIError({ message, curl: res.curl, description: res.log })
  }

  return res.data
}

const command: Command = {
  id: "joinleave_info",
  command: "info",
  brief: "Show this server's configured joinleave channel",
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
              title: "Join-Leave channel",
              description: `No joinleave channel configured for this guild.\nSet one with \`${PREFIX}joinleave set <channel>.\``,
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
        examples: `${PREFIX}joinleave set #vote`,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
}

export default command
