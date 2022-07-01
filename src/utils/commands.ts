import { Message } from "discord.js"

import { Command } from "types/common"
import { HELP, HELP_CMD, PREFIX, SPACE } from "./constants"
import { commands } from "commands"

export const getCommandArguments = (message: Message) =>
  message?.content?.split(SPACE) ?? []

export const specificHelpCommand = (message: Message) => {
  const args = getCommandArguments(message)
  return args.length > 1 && (args[0] === HELP_CMD || args[1] === HELP)
}

export const getAllAliases = (
  commands: Record<string, Command>
): Record<string, Command> => {
  return Object.entries(commands).reduce((acc, cur) => {
    const commandObj = cur[1]
    const aliases = (commandObj.aliases ?? []).reduce(
      (accAliases, curAlias) => ({
        ...accAliases,
        [curAlias]: commandObj,
      }),
      {}
    )

    return {
      ...acc,
      ...aliases,
    }
  }, commands)
}

export const getCommandObject = (msg: Message): Command => {
  const args = getCommandArguments(msg)
  if (!args.length) return null
  const { commandKey } = getCommandMetadata(msg)
  return commands[commandKey]
}

export const getActionCommand = (msg: Message): Command => {
  const args = getCommandArguments(msg)
  if (!args.length) return null
  const { commandKey: key, action } = getCommandMetadata(msg)

  if (!key || !action || !commands[key].actions) return null
  const actions = Object.entries(commands[key].actions).filter(
    (c) =>
      (c[1].aliases && c[1].aliases.includes(action)) || c[1].command === action
  )
  if (!actions.length) return null
  return actions[0][1]
}

export const getCommandMetadata = (msg: Message) => {
  if (!msg?.content) return {}
  const args = getCommandArguments(msg)
  const isSpecificHelpCommand = specificHelpCommand(msg)
  let commandKey, action
  switch (true) {
    case isSpecificHelpCommand && args[0] === HELP_CMD:
      commandKey = args[1]
      action = args[2]
      break
    case isSpecificHelpCommand && args[1] === HELP:
      commandKey = args[0].slice(PREFIX.length)
      action = args[2]
      break
    case !isSpecificHelpCommand:
      commandKey = args[0].slice(PREFIX.length)
      action = args[1]
      break
  }
  return { commandKey, action }
}
