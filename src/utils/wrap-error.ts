import { commands } from "commands"
import { CommandInteraction, Message } from "discord.js"
import { getCommandMetadata } from "./commands"
import { Sentry } from "sentry"
import { version } from "../../package.json"
import { PRODUCT_NAME } from "./constants"

const cc: Record<string, any> = {
  extra: {
    version: `v${version}`,
  },
  contexts: {},
}

export async function wrapError(
  msg: Message | CommandInteraction | string,
  func: () => Promise<void>,
) {
  try {
    await func()
  } catch (e: any) {
    let commandStr = ""

    // get command name from text command
    if (msg instanceof Message) {
      commandStr = `/${getCommandMetadata(commands, msg).commandKey}`
    }

    // get command name from slash command
    if (msg instanceof CommandInteraction) commandStr = `/${msg.commandName}`

    // prepend product name and command name
    e.name = `${PRODUCT_NAME}: ${commandStr} ${e.name}`

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
    }

    Sentry.captureException(e, cc)
  }
}
