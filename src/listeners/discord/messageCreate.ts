import webhook from "adapters/webhook"
import { handlePrefixedCommand } from "commands"
import { Message } from "discord.js"
import tagme from "handlers/tagme"
import { textCommandAsyncStore } from "utils/async-storages"
import {
  MOCHI_PROFILE_API_BASE_URL,
  PREFIX,
  VALID_BOOST_MESSAGE_TYPES,
} from "utils/constants"
import { wrapError } from "utils/wrap-error"
import { DiscordEvent } from "./index"
import fetch from "node-fetch"

export const handleNormalMessage = async (message: Message) => {
  try {
    if (message.channel.type === "DM") return

    const messageType = VALID_BOOST_MESSAGE_TYPES.includes(message.type) ? 9 : 1

    const stickers = Array.from(message.stickers.values())

    const profileRes = await fetch(
      `${MOCHI_PROFILE_API_BASE_URL}/profiles/get-by-discord/${message.author.id}?no-fetch-amount=true`
    )
    const profileId = (await profileRes.json())?.id
    const body = {
      author: {
        id: message.author.id,
        avatar: message.author.avatarURL(),
        username: message.author.username,
      },
      guild_id: message.guildId,
      channel_id: message.channelId,
      timestamp: message.createdAt.toISOString(),
      content: message.content,
      sticker_items: stickers,
      type: messageType,
    }

    await webhook.pushDiscordWebhook("messageCreate", body, profileId)
  } catch (e) {
    // swallow, intentional
  }
}

const events: DiscordEvent<"messageCreate"> = {
  name: "messageCreate",
  once: false,
  execute: async (message) => {
    textCommandAsyncStore.run(
      {
        msgOrInteraction: message,
        data: JSON.stringify({
          sub_event_type: "messageCreate",
          guild_id: message.guildId || "DM",
          channel_id: message.channelId,
          discord_id: message.author.id,
          command: message.content,
          msg_id: message.id,
        }),
      },
      () => {
        wrapError(message, async () => {
          // deny handling if author is bot or message is empty (new user join server)
          if (
            message.author.bot ||
            (!message.content && !message.stickers.size)
          )
            return
          if (message.content.startsWith(PREFIX)) {
            await handlePrefixedCommand(message)
            return
          }
          tagme.handle(message)
          await handleNormalMessage(message)
        })
      }
    )
  },
}

export default events
