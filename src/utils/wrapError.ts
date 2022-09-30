import { Interaction, Message } from "discord.js"
import { BotBaseError } from "errors"
import { logger } from "logger"
import ChannelLogger from "./ChannelLogger"

function catchAll(e: any) {
  logger.error(e)
}

export async function wrapError(
  msg: Message | Interaction | null,
  func: () => Promise<void>
) {
  try {
    await func()
  } catch (e: any) {
    let error = e as BotBaseError

    if (msg instanceof Message || msg instanceof Interaction) {
      let message
      if (msg instanceof Message) {
        message = msg
      } else {
        if (msg.isSelectMenu() || msg.isButton() || msg.isCommand()) {
          if ("message" in msg && msg.message instanceof Message) {
            message = await msg.message.fetchReference()
          }
        }
        message = msg
      }
      if (message instanceof Message) {
        // something went wrong
        if (!(error instanceof BotBaseError)) {
          error = new BotBaseError(message, e.message as string)
        }
        error.handle?.()
        ChannelLogger.alert(message, error).catch(catchAll)
      } else if (message.isCommand()) {
        ChannelLogger.alertSlash(message, error).catch(catchAll)
      }
    } else if (e instanceof Error && e.stack) {
      ChannelLogger.alertStackTrace(e.stack).catch(catchAll)
    }
  }
}
