import { commands } from "commands"
import { CommandInteraction, Message } from "discord.js"
import { getCommandMetadata } from "./commands"
import { Sentry } from "sentry"
import { version } from "../../package.json"
import { PRODUCT_NAME } from "./constants"
import { APIError, BotBaseError } from "errors"

function isMsg(msg: any): msg is Message {
  return msg instanceof Message
}

export async function wrapError(
  msg: Message | CommandInteraction | string,
  func: () => Promise<void>,
) {
  const cc: Record<string, any> = {
    extra: {
      version: `v${version}`,
    },
    contexts: {},
  }

  try {
    await func()
  } catch (e: any) {
    let commandStr = ""

    if (typeof msg === "string") {
      // event
      cc.extra.event = { name: msg }
    } else {
      // text/slash command
      cc.extra.user = {
        id: msg.member?.user.id,
        username: msg.member?.user.username,
      }
      cc.extra.guild = {
        id: msg.guildId,
        name: msg.guild?.name || "Unknown guild",
      }
      cc.contexts.command = { raw: commandStr }

      // get command name from text command
      if (
        !commandStr &&
        isMsg(msg) &&
        msg.interaction?.type === "APPLICATION_COMMAND"
      )
        commandStr = `/${msg.interaction.commandName}`

      // get command name from slash command
      if (!commandStr && msg instanceof CommandInteraction)
        commandStr = `/${msg.commandName}`

      if (!commandStr && isMsg(msg))
        commandStr = `/${
          getCommandMetadata(commands, msg as Message).commandKey
        }`
    }

    // prepend product name and command name
    e.name = `${PRODUCT_NAME}: ${commandStr} ⎯  ${e.name}`

    // calling api failed, with status code 500, send to sentry
    if (e instanceof APIError && e.status === 500) {
      Sentry.captureException(e, cc)
      return
    }

    // handle validation error, error status code 400, show to user without send alert
    if (e instanceof BotBaseError) {
      e.handle?.()
      return
    }

    // unexpected error -> send to sentry
    Sentry.captureException(e, cc)
  }
}
