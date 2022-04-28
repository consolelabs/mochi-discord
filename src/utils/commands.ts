import { Message } from "discord.js"

import { Command } from "types/common"
import { HELP_CMD, PREFIX, SPACE } from "./constants"
import { commands } from "commands"

export const getCommandArguments = (message: Message) =>
  message ? message.content.split(SPACE) : []

export const specificHelpCommand = (message: Message) =>
  message?.content?.startsWith(HELP_CMD) &&
  getCommandArguments(message).length > 1

export const getAllAliases = (
  commands: Record<string, Command>
): Record<string, Command> => {
  return Object.entries(commands).reduce((acc, cur) => {
    const [_key, commandObj] = cur
    const aliases = (commandObj.aliases ?? []).reduce(
      (accAliases, curAlias) => ({
        ...accAliases,
        [curAlias]: commandObj
      }),
      {}
    )

    return {
      ...acc,
      ...aliases
    }
  }, commands)
}

export const getCommandObject = (msg: Message): Command => {
  const args = getCommandArguments(msg)
  if (!args.length) return null
  const key = specificHelpCommand(msg) ? args[1] : args[0].slice(PREFIX.length)
  return commands[key]
}

export const getActionCommand = (msg: Message): Command => {
  const args = getCommandArguments(msg)
  if (!args.length) return null
  let action: string, key: string
  switch (true) {
    case specificHelpCommand(msg) && args.length >= 3:
      key = args[1]
      action = args[2]
      break
    case !specificHelpCommand(msg) && args.length >= 2:
      key = args[0].slice(PREFIX.length)
      action = args[1]
      break
    default:
      key = null
      action = null
      break
  }

  if (!key || !action || !commands[key].actions) return null
  const actions = Object.entries(commands[key].actions).filter(
    c =>
      (c[1].aliases && c[1].aliases.includes(action)) || c[1].command === action
  )
  if (!actions.length) return null
  return actions[0][1]
}
