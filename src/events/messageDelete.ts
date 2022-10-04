import { VALID_BOOST_MESSAGE_TYPES } from "utils/constants"
import { DiscordEvent } from "."
import webhook from "adapters/webhook"
import { MessageTypes } from "discord.js/typings/enums"
import { wrapError } from "utils/wrapError"

const event: DiscordEvent<"messageDelete"> = {
  name: "messageDelete",
  once: false,
  execute: async (msg) => {
    msg
      .fetch()
      .then(async (message) => {
        wrapError(message, async () => {
          if (message.channel.type === "DM") return

          const messageType = VALID_BOOST_MESSAGE_TYPES.includes(message.type)
            ? MessageTypes["USER_PREMIUM_GUILD_SUBSCRIPTION"]
            : MessageTypes["DEFAULT"]
          const body = {
            author: {
              id: message.author?.id,
              avatar: message.author?.avatarURL(),
              username: message.author?.username,
            },
            id: message.id,
            guild_id: message.guildId,
            channel_id: message.channelId,
            timestamp: message.createdAt.toISOString(),
            content: message.content,
            type: messageType,
          }

          await webhook.pushDiscordWebhook("messageDelete", body)
        })
      })
      .catch(() => null)
  },
}

export default event
