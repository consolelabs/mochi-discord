import webhook from "adapters/webhook"
import { handlePrefixedCommand } from "commands"
import { Message } from "discord.js"
import { MessageTypes } from "discord.js/typings/enums"
import tagme from "handlers/tagme"
import { PREFIX, VALID_BOOST_MESSAGE_TYPES } from "utils/constants"
import { wrapError } from "utils/wrap-error"
import { DiscordEvent } from "./index"

export const handleNormalMessage = async (message: Message) => {
  if (message.channel.type === "DM") return

  const messageType = VALID_BOOST_MESSAGE_TYPES.includes(message.type)
    ? MessageTypes["USER_PREMIUM_GUILD_SUBSCRIPTION"]
    : MessageTypes["DEFAULT"]

  const stickers = Array.from(message.stickers.values())

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

  await webhook.pushDiscordWebhook("messageCreate", body)
}

const events: DiscordEvent<"messageCreate"> = {
  name: "messageCreate",
  once: false,
  execute: async (message) => {
    // deny handling if author is bot or message is empty (new user join server)
    wrapError(message, async () => {
      if (message.author.bot || (!message.content && !message.stickers.size))
        return
      if (message.content.startsWith(PREFIX)) {
        await handlePrefixedCommand(message)
        return
      }
      tagme.handle(message)
      await handleNormalMessage(message)
    })
  },
}

export default events
