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
      let message = msg
      if (
        msg instanceof Interaction &&
        (msg.isSelectMenu() || msg.isButton() || msg.isCommand())
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
        // something went wrong
        if (!(error instanceof BotBaseError)) {
          error = new BotBaseError(message, e.message as string)
        }
        error.handle?.()
        ChannelLogger.alert(message, error).catch(catchAll)
        return
      } else if (message.isCommand()) {
        ChannelLogger.alertSlash(message, error).catch(catchAll)
        return
      }
    }

    // if it reaches here then we're screwed
    if (e instanceof Error && e.stack) {
      ChannelLogger.alertStackTrace(e.stack).catch(catchAll)
    }
  }
}
