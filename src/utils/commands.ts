import { Message } from "discord.js"

import { Command } from "types/common"
import {
  CHANNEL_PREFIX,
  EMOJI_PREFIX,
  HELP,
  PREFIX,
  ROLE_PREFIX,
  SPACES_REGEX,
  USER_PREFIX,
} from "./constants"
import { commands } from "commands"
import { utils } from "ethers"

export const getCommandArguments = (message: Message) => {
  const content = message?.content
  if (!content) return []
  return content
    .slice(content.startsWith(PREFIX) ? PREFIX.length : 0)
    .split(SPACES_REGEX)
}

export const specificHelpCommand = (message: Message | null) => {
  if (!message) return null
  const args = getCommandArguments(message)
  return (
    args.length > 1 &&
    args
      .slice(0, 2)
      .map((arg) => arg.toLowerCase())
      .includes(HELP)
  )
}

export const getAllAliases = (
  commands?: Record<string, Command>
): Record<string, Command> => {
  if (!commands) return {}
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

export const getCommandObject = (msg: Message | null): Command | null => {
  if (!msg) return null
  const args = getCommandArguments(msg)
  if (!args.length) return null
  const { commandKey } = getCommandMetadata(msg)
  if (commandKey) return commands[commandKey]
  return null
}

export const getActionCommand = (msg: Message | null): Command | null => {
  if (!msg) return null
  const args = getCommandArguments(msg)
  if (!args.length) return null
  const { commandKey: key, action } = getCommandMetadata(msg)

  if (!key || !action || !commands[key].actions) return null
  const command = commands[key]
  if (!command.actions) return null
  const actions = Object.entries(command.actions).filter(
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
  let commandKey: string | undefined
  let action: string | undefined
  switch (true) {
    case isSpecificHelpCommand && args[0].toLowerCase() === HELP:
      commandKey = args[1]
      action = args[2]
      break
    case isSpecificHelpCommand && args[1].toLowerCase() === HELP:
      commandKey = args[0]
      action = args[2]
      break
    case !isSpecificHelpCommand:
      commandKey = args[0]
      action = args[1]
      break
  }
  commandKey = commandKey?.toLowerCase()
  action = action?.toLowerCase()

  if (commandKey && action) {
    const cmdObj = commands[commandKey]
    if (!Object.keys(cmdObj?.actions ?? []).includes(action)) action = undefined
  }
  return { commandKey, action }
}

export function parseDiscordToken(value: string) {
  const _value = value.trim()
  return {
    isEmoji: _value.startsWith(EMOJI_PREFIX) && _value.endsWith(">"),
    isUser: _value.startsWith(USER_PREFIX) && _value.endsWith(">"),
    isRole: _value.startsWith(ROLE_PREFIX) && _value.endsWith(">"),
    isChannel: _value.startsWith(CHANNEL_PREFIX) && _value.endsWith(">"),
    isId: /\d+/g.test(_value),
    isAddress: utils.isAddress(_value),
    id: utils.isAddress(_value) ? _value : _value.replace(/\D/g, ""),
  }
}

// export const normalizeMessage = (msg: Message) => {
//   const { commandKey, action } = getCommandMetadata(msg)
//   const lowercaseArgs = [`${commandKey}`, action]
//   msg.content = getCommandArguments(msg)
//     .map((arg) => {
//       const idx = lowercaseArgs.indexOf(arg)
//       if (idx >= 0) {
//         lowercaseArgs.splice(idx, 1)
//         return arg.toLowerCase()
//       }
//       return arg
//     })
//     .join(SPACE)
// }
