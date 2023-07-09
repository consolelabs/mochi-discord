import { commands } from "commands"
import { Interaction, Message } from "discord.js"
import { BotBaseError } from "errors"
import { logger } from "logger"
import { KafkaQueueMessage } from "types/common"
import ChannelLogger from "../logger/channel"
import { getCommandMetadata } from "./commands"
import kafka from "queue/kafka"

function catchAll(e: any) {
  logger.error(e)
}

export async function wrapError(
  msg: Message | Interaction | Record<string, any>,
  func: () => Promise<void>
) {
  try {
    await func()
  } catch (e: any) {
    let error = e as BotBaseError
    if (msg instanceof Message || msg instanceof Interaction) {
      let message = msg
      const guildId = msg.guildId ?? "DM"
      let userId = ""
      let commandStr = ""
      let args = ""
      let commandType = ""
      let subcommand = ""
      let msgToKafka = null
      let interactionToKafka = null
      if (
        msg instanceof Interaction &&
        (msg.isMessageComponent() || msg.isCommand())
      ) {
        if (
          "message" in msg &&
          msg.message instanceof Message &&
          msg.message.reference
        ) {
          const originalMsg = await msg.message
            .fetchReference()
            .catch(() => null)
          if (originalMsg && !originalMsg.author.bot) {
            message = originalMsg
          }
        }
      }
      if (message instanceof Message) {
        // get command info
        const { commandKey } = getCommandMetadata(commands, message)
        if (commandKey) {
          const commandObject = commands[commandKey]
          userId = message.author.id
          commandStr = commandObject?.id
          args = message.content
        }
        commandType = "$"
        msgToKafka = message

        // something went wrong
        if (!(error instanceof BotBaseError)) {
          error = new BotBaseError(message, e.message as string)
        }
        error.handle?.()
        ChannelLogger.alert(message, error).catch(catchAll)
      } else if (message.isCommand()) {
        // get command info
        userId = message.user.id
        commandStr = message.options.getSubcommand(false)
          ? message.commandName + " " + message.options.getSubcommand(false)
          : message.commandName
        args = commandStr
        subcommand = message.options.getSubcommand(false) || ""
        commandType = "/"
        interactionToKafka = message

        // something went wrong
        if (!(error instanceof BotBaseError)) {
          error = new BotBaseError(message, e.message as string)
        }
        error.handle?.()
        ChannelLogger.alertSlash(message, error).catch(catchAll)
      } else if (message.isMessageComponent()) {
        if (!(error instanceof BotBaseError)) {
          error = new BotBaseError(message, e.message as string)
        }
        error.handle?.()
        ChannelLogger.alert(message.message as Message, error).catch(catchAll)
      }
      // send command info to kafka
      try {
        const kafkaMsg: KafkaQueueMessage = {
          platform: "discord",
          data: {
            command: commandStr,
            subcommand,
            full_text_command: args,
            command_type: commandType,
            channel_id: msg.channelId || "DM",
            guild_id: guildId,
            author_id: userId,
            success: false,
            execution_time_ms: 0,
            message: msgToKafka,
            interaction: interactionToKafka,
          },
        }
        await kafka.queue?.produceBatch(kafkaMsg)
      } catch (error) {
        logger.error("[wrapError] kafkaQueue?.produceBatch() failed")
      }
      return
    }

    logger.error(`[wrapError] ${func.name}() error: ${e}`)
    if (error.handle && typeof error.handle === "function") {
      error.handle?.()
    } else {
      await kafka.queue?.produceAnalyticMsg([msg]).catch(() => null)
    }
    if (e instanceof Error && e.stack) {
      ChannelLogger.alertStackTrace(e.stack).catch(catchAll)
      return
    }
  }
}
