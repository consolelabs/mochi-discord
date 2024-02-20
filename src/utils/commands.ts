import { ApplicationCommandOptionType, Routes } from "discord-api-types/v9"
import { CommandInteraction, Message } from "discord.js"
import getEmojiRegex from "emoji-regex"
import { APPLICATION_ID, DISCORD_TOKEN, TEST } from "env"
import config from "../adapters/config"

import { utils } from "ethers"
import { Command, SlashCommand, embedsColors } from "types/common"
import { getEmoji } from "./common"
import {
  ANIMATED_EMOJI_REGEX,
  CHANNEL_REGEX,
  EMOJI_REGEX,
  HELP,
  HOMEPAGE_URL,
  PREFIX,
  ROLE_REGEX,
  SLASH_PREFIX,
  SPACES_REGEX,
  USER_REGEX,
} from "./constants"
import { REST } from "@discordjs/rest"

const NATIVE_EMOJI_REGEX = getEmojiRegex()

export let commandPermissions = new Map<string, string>()

const rest = new REST({ version: "9" }).setToken(DISCORD_TOKEN)
let cacheSlash = new Map<string, string>()

export async function getSlashCommand(name: string) {
  if (!cacheSlash.size && !TEST) {
    const result = (await rest.get(
      Routes.applicationCommands(APPLICATION_ID),
    )) as Array<any>
    const slashData = Array.from(
      result
        .map((r) => {
          let childCommands = []
          if (r.options) {
            const subCmds = r.options.filter((opt: any) =>
              [
                ApplicationCommandOptionType.SubcommandGroup,
                ApplicationCommandOptionType.Subcommand,
              ].includes(opt.type),
            )
            if (subCmds.length) {
              childCommands = subCmds
                .map((subCmdOrGroup: any) => {
                  if (
                    subCmdOrGroup.type ===
                    ApplicationCommandOptionType.Subcommand
                  ) {
                    return [[`${r.name} ${subCmdOrGroup.name}`, r.id]]
                  } else {
                    return subCmdOrGroup.options.map((subCmd: any) => {
                      return [
                        `${r.name} ${subCmdOrGroup.name} ${subCmd.name}`,
                        r.id,
                      ]
                    })
                  }
                })
                .flat()
            }
          }
          return childCommands.concat([[r.name, r.id]])
        })
        .flat(),
    )
    cacheSlash = new Map(slashData)
  }

  const slashCmdId = cacheSlash.get(name)
  if (!slashCmdId) return `${SLASH_PREFIX}${name}`
  return `</${name}:${cacheSlash.get(name)}>`
}

export const getCommandArguments = (message: Message) => {
  const content = message?.content
  if (!content) return []
  return content
    .slice(content.startsWith(PREFIX) ? PREFIX.length : 0)
    .split(SPACES_REGEX)
}

export const specificHelpCommand = (message?: Message | null) => {
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
  commands?: Record<string, Command>,
): Record<string, Command> => {
  if (!commands) return {}
  return Object.entries(commands).reduce((acc, cur) => {
    const commandObj = cur[1]
    const aliases = (commandObj.aliases ?? []).reduce(
      (accAliases, curAlias) => ({
        ...accAliases,
        [curAlias]: commandObj,
      }),
      {},
    )

    return {
      ...acc,
      ...aliases,
    }
  }, commands)
}

// TODO: remove after slash command migration done
export const getCommandObject = (
  commands: Record<string, Command>,
  msg?: Message | null,
): Command | null => {
  if (!msg) return null
  const args = getCommandArguments(msg)
  if (!args.length) return null
  const { commandKey } = getCommandMetadata(commands, msg)
  if (commandKey) return commands[commandKey]
  return null
}

export const getActionCommand = (
  commands: Record<string, Command>,
  msg?: Message | null,
): Command | null => {
  if (!msg) return null
  const args = getCommandArguments(msg)
  if (!args.length) return null
  const { commandKey: key, action } = getCommandMetadata(commands, msg)

  if (!key || !action || !commands[key].actions) return null
  const command = commands[key]
  if (!command.actions) return null
  const actions = Object.entries(command.actions).filter(
    (c) =>
      (c[1].aliases && c[1].aliases.includes(action)) ||
      c[1].command === action,
  )
  if (!actions.length) return null
  return actions[0][1]
}

export const getCommandMetadata = (
  commands: Record<string, Command>,
  msg: Message,
) => {
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
  return { commandKey, action, isSpecificHelpCommand }
}

/**
 * Parse a discord "token" (a string in some special format) and
 * return what type that token is + the extracted value (empty string if no types were found)
 *  @param {string} value - The discord token
 *  @returns {object} The object containing boolean flags to check the token type and the extracted value
 * */
export function parseDiscordToken(value: string) {
  const _value = value.trim()
  const emoji = _value.match(EMOJI_REGEX)?.at(2)
  const animatedEmoji = _value.match(ANIMATED_EMOJI_REGEX)?.at(2)
  const nativeEmoji = _value.match(NATIVE_EMOJI_REGEX)?.at(0)
  const user = _value.match(USER_REGEX)?.at(1)
  const channel = _value.match(CHANNEL_REGEX)?.at(1)
  const role = _value.match(ROLE_REGEX)?.at(1)
  const id = _value.match(/^(\d+)$/i)?.at(1)

  const isUnknown =
    [
      emoji,
      animatedEmoji,
      Boolean(nativeEmoji) && nativeEmoji === _value,
      user,
      channel,
      role,
      id,
    ].findIndex(Boolean) === -1

  return {
    isEmoji: Boolean(emoji),
    isAnimatedEmoji: Boolean(animatedEmoji),
    isNativeEmoji: Boolean(nativeEmoji) && nativeEmoji === _value,
    isUser: Boolean(user),
    isRole: Boolean(role),
    isChannel: Boolean(channel),
    isId: Boolean(id),
    isAddress: utils.isAddress(_value),
    isUnknown,
    value: utils.isAddress(_value)
      ? _value
      : isUnknown
      ? ""
      : // because these values are mutually exclusive
        // => find the first value that is not undefined
        [emoji, animatedEmoji, nativeEmoji, user, channel, role, id].find(
          Boolean,
        ) ?? "",
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

export function getSlashCommandObject(
  slashCommands: Record<string, SlashCommand>,
  interaction: CommandInteraction,
): SlashCommand | null {
  if (!interaction) return null
  return slashCommands[interaction.commandName]
}

// TODO: add test (Tuan)
export const getReactionIdentifier = (
  emojiId: string | null,
  emojiName: string | null,
  identifier: string,
): string => {
  let reaction = ""
  if (emojiId) {
    reaction = "<:" + identifier + ">"
  } else {
    reaction = emojiName ?? ""
  }
  return reaction
}

// TODO: remove after slash command migration done
export function getCommandColor(commandObj: Command | null) {
  return embedsColors[commandObj?.colorType ?? "Command"]
}

export function getSlashCommandColor(commandObj: SlashCommand | null) {
  return embedsColors[commandObj?.colorType ?? "Command"]
}

export function getCommandsList(
  commands: Record<string, Pick<Command, "command" | "brief" | "experimental">>,
) {
  const emoji = getEmoji("REPLY")
  const correctBrief = (brief: string) =>
    brief.endsWith(".") ? brief : `${brief}.`
  return Object.values(commands)
    .filter((c) => !c.experimental)
    .map(
      (c) =>
        `[**${c.command}**](${HOMEPAGE_URL})\n${emoji}${correctBrief(c.brief)}`,
    )
    .join("\n\n")
}

// function to check cmd to such as $nr, $nr set to help cmd
export function isAcceptableCmdToHelp(
  cmd: string,
  aliases: string[],
  action: string,
  msg: string,
) {
  let lstCmd = [`$` + cmd]
  if (aliases) {
    lstCmd = lstCmd.concat(aliases.map((v) => `$` + v))
  }
  if (action) {
    lstCmd = lstCmd.concat(lstCmd.map((v) => v + " " + action))
  }
  return lstCmd.includes(msg.split(/ +/g).join(" "))
}

export async function fetchCommandPermissions() {
  try {
    const { data } = await config.getCommandPermissions()
    if (data) {
      commandPermissions = new Map(
        data
          .filter((d) => d.code && d.discord_permission_flag)
          .map((d) => [d.code ?? "", d.discord_permission_flag ?? ""]),
      )
    }
  } catch (e) {}
}
