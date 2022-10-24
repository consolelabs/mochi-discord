import usage_stats from "adapters/usage_stats"
import { commands } from "commands"
import { Interaction, Message } from "discord.js"
import { BotBaseError } from "errors"
import { logger } from "logger"
import ChannelLogger from "./ChannelLogger"
import { getCommandMetadata } from "./commands"

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
      const guildId = msg.guildId ?? "DM"
      let userId = ""
      let commandStr = ""
      let args = ""
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
        // get command info
        const { commandKey } = getCommandMetadata(commands, message)
        if (commandKey) {
          const commandObject = commands[commandKey]
          userId = message.author.id
          commandStr = commandObject.id
          args = message.content
        }
        //

        // something went wrong
        if (!(error instanceof BotBaseError)) {
          error = new BotBaseError(message, e.message as string)
        }
        error.handle?.()
        ChannelLogger.alert(message, error).catch(catchAll)
      } else if (message.isCommand()) {
        // get command info
        userId = message.user.id
        commandStr =
          message.commandName + message.options.getSubcommand(false)
            ? "_" + message.options.getSubcommand(false)
            : ""
        args = commandStr
        //
        ChannelLogger.alertSlash(message, error).catch(catchAll)
      }
      // send command info to store
      usage_stats.createUsageStat({
        guild_id: guildId,
        user_id: userId,
        command: commandStr,
        args: args,
        success: false,
      })
      return
    }

    // if it reaches here then we're screwed
    if (e instanceof Error && e.stack) {
      ChannelLogger.alertStackTrace(e.stack).catch(catchAll)
    }
  }
}
