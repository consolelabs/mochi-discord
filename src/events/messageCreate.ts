import { Message } from "discord.js"
import handlePrefixedCommand from "../commands"
import { LOG_CHANNEL_ID, MOCHI_GUILD_ID, SALE_CHANNEL_ID } from "../env"
import { PREFIX, VALID_BOOST_MESSAGE_TYPES } from "utils/constants"
import { Event } from "."
import { logger } from "../logger"
import { BotBaseError } from "errors"
import ChannelLogger from "utils/ChannelLogger"
import CommandChoiceManager from "utils/CommandChoiceManager"
import webhook from "adapters/webhook"
import { MessageTypes } from "discord.js/typings/enums"
import { handlePlayTripod } from "commands/games/tripod"
import { handleNewTweet } from "commands/config/poe/twitter"

export const handleNormalMessage = async (message: Message) => {
  if (message.channel.type === "DM") return

  const messageType = VALID_BOOST_MESSAGE_TYPES.includes(message.type)
    ? MessageTypes["USER_PREMIUM_GUILD_SUBSCRIPTION"]
    : MessageTypes["DEFAULT"]

  let body, msg
  if (
    message.guildId === MOCHI_GUILD_ID &&
    message.channelId === SALE_CHANNEL_ID &&
    message.embeds.length !== 0
  ) {
    const regExpParen = /\(([^)]+)\)/ // match string inside ( )
    const regExpBrac = /\[([^\]]+)\]/ // match string inside [ ]
    const url = regExpParen.exec(message.embeds[0].fields[2].value)[1]
    const marketplace = regExpBrac.exec(message.embeds[0].fields[2].value)[1]
    const from = regExpBrac.exec(message.embeds[0].fields[4].value)[1]
    const to = regExpBrac.exec(message.embeds[0].fields[5].value)[1]
    const price = message.embeds[0].fields[7].value
    const collection = message.embeds[0].author.name
    const name = message.embeds[0].description.replace("sold!", "")
    const image = message.embeds[0].image.url
    body = {
      token_name: name,
      collection_name: collection,
      price: price,
      seller_address: from,
      buyer_address: to,
      marketplace: marketplace,
      marketplace_url: url,
      image: image,
    }
    msg = "salesCreate"
  } else {
    body = {
      author: {
        id: message.author.id,
      },
      guild_id: message.guildId,
      channel_id: message.channelId,
      timestamp: message.createdAt,
      content: message.content,
      type: messageType,
    }
    msg = "messageCreate"
  }
  const resp = await webhook.pushDiscordWebhook(msg, body)
  if (resp.error != undefined) {
    logger.error(`failed to handle webhook: ${resp.error}`)
  }
}

export default {
  name: "messageCreate",
  once: false,
  execute: async (message: Message) => {
    if (
      message.channel.id === LOG_CHANNEL_ID ||
      (message.author.bot && message.channelId !== SALE_CHANNEL_ID)
    )
      return

    try {
      if (message.content.startsWith(PREFIX)) {
        // disable previous command choice handler before executing new command
        const key = `${message.author.id}_${message.guildId}_${message.channelId}`
        CommandChoiceManager.remove(key)
        await handlePrefixedCommand(message)
        return
      }
      await handleNormalMessage(message)
      handlePlayTripod(message)
      handleNewTweet(message)
    } catch (e) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e as string)
      }
      ChannelLogger.log(error, 'Event<"messageCreate">')
    }
  },
} as Event<"messageCreate">
