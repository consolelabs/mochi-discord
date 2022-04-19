import { Interaction, Message, MessageInteraction } from "discord.js"
import handleCommand from "../commands"
import { LOG_CHANNEL_ID } from "../env"
import { DM_COMMANDS, PREFIX, SPACE } from "utils/constants"
import { Event } from "."
import { logger } from "../logger"
import { BotBaseError } from "errors"
import ChannelLogger from "utils/ChannelLogger"
import CommandChoiceManager from "utils/CommandChoiceManager"
import { handleNormalMessage } from "utils/common"

const allowedDMCommands = DM_COMMANDS.map((c) => `${PREFIX}${c}`)
function normalizeCommand(message: Message) {
  return message.content.replace(/  +/g, " ").trim().toLowerCase()
}

const isInBotCommandScopes = (message: Message) =>
  message.channel.type !== "DM" ||
  allowedDMCommands.includes(message.content.split(SPACE)[0])

export default {
  name: "messageCreate",
  once: false,
  execute: async (message: Message) => {
    message.content = normalizeCommand(message)
    if (
      message.channel.id === LOG_CHANNEL_ID ||
      message.author.bot ||
      !isInBotCommandScopes(message)
    )
      return

    try {
      if (message.content.startsWith(PREFIX)) {
        // disable previous command choice handler before executing new command
        if (message.channel.type !== "DM") {
          const key = `${message.author.id}_${message.guildId}_${message.channelId}`
          CommandChoiceManager.remove(key)
        }
        await handleCommand(message)
        return
      }
      await handleNormalMessage(message)
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
