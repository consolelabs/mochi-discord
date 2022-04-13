import Discord from "discord.js"
import handleCommand from "../commands"
import { PREFIX, ADMIN_PREFIX, LOG_CHANNEL_ID } from "../env"
import { Event } from "."
import { logger } from "../logger"
import { BotBaseError } from "errors"
import ChannelLogger from "utils/ChannelLogger"
import CommandChoiceManager from "utils/CommandChoiceManager"

export default {
  name: "messageCreate",
  once: false,
  execute: async (message: Discord.Message) => {
    if (message.channel.id === LOG_CHANNEL_ID) return
    try {
      const messageContent = message.content.toLowerCase()
      const isGmMessage =
        messageContent === "gm" ||
        messageContent === "gn" ||
        messageContent === "<:gm:930840080761880626>" ||
        (message.stickers.get("928509218171006986") &&
          message.stickers.get("928509218171006986").name === ":gm")

      // ---------------------------
      // handle command
      if (!message.author.bot) {
        if (message.channel.type !== "DM") {
          if (
            messageContent.startsWith(PREFIX) ||
            messageContent.startsWith(ADMIN_PREFIX) ||
            isGmMessage
          ) {
            const key = `${message.author.id}_${message.guildId}_${message.channelId}`
            // disable previous command choice handler before executing new command
            CommandChoiceManager.remove(key)
            await handleCommand(message)
          }
          return
        } else if (messageContent.startsWith(`${PREFIX}deposit`)) {
          await handleCommand(message)
        }
      }
    } catch (e: any) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e)
      }
      ChannelLogger.log(error)
    }
  },
} as Event<"messageCreate">
