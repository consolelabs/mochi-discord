import { VALID_BOOST_MESSAGE_TYPES } from "utils/constants"
import { DiscordEvent } from "."
import webhook from "adapters/webhook"
import { wrapError } from "utils/wrap-error"
import { Message } from "discord.js"
import { textCommandAsyncStore } from "utils/async-storages"

const event: DiscordEvent<"messageDelete"> = {
  name: "messageDelete",
  once: false,
  execute: async (msg) => {
    const message = msg as Message<boolean>
    textCommandAsyncStore.run(
      {
        data: JSON.stringify({
          sub_event_type: "messageDelete",
          guild_id: msg.guildId || "DM",
          channel_id: msg.channelId,
          discord_id: msg.author?.id ?? "Unknown",
          command: msg.content,
          msg_id: msg.id,
        }),
      },
      async () => {
        await wrapError(message, async () => {
          if (message.channel.type === "DM") return

          const messageType = VALID_BOOST_MESSAGE_TYPES.includes(message.type)
            ? 9
            : 1
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
      },
    )
  },
}

export default event
