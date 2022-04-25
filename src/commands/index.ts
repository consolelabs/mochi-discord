import { Message } from "discord.js"
import { PREFIX } from "utils/constants"
import { logger } from "../logger"
import help from "./help"
import invite from "./community/invite/index"
import profile from "./profile"
import verify from "./profile/verify"
import reverify from "./profile/reverify"
import deposit from "./defi/deposit"
import tip from "./defi/tip"
import balances from "./defi/balances"
import withdraw from "./defi/withdraw"
import tokens from "./defi/tokens"
import { getCommandArguments, specificHelpCommand } from "utils/common"
import config from "../adapters/config"
import { CommandNotAllowedToRunError, CommandNotFoundError } from "errors"
import guildCustomCommand from "../modules/guildCustomCommand"
import { customCommandsExecute } from "./customCommand"
import CommandChoiceManager from "utils/CommandChoiceManager"
import ticker from "./defi/ticker"
import airdrop from "./defi/airdrop"
import reaction from "./config/reaction"
import channel from "./config/channel"
import chat from "./community/chat"
import gm from "./community/gm"
import { Command, Category } from "types/common"

export const originalCommands: Record<string, Command> = {
  // general help
  help,
  // profile
  profile,
  verify,
  reverify,
  // defi
  deposit,
  tip,
  balances,
  withdraw,
  tokens,
  ticker,
  airdrop,
  // community
  invite,
  chat,
  gm,
  // config
  reaction,
  channel,
}

const aliases: Record<string, Command> = Object.entries(
  originalCommands
).reduce((acc, cur) => {
  const [_name, commandObj] = cur
  let aliases = {}
  if (commandObj.alias?.length > 0) {
    aliases = commandObj.alias.reduce((aliasObject, alias) => {
      return {
        ...aliasObject,
        [alias]: commandObj,
      }
    }, {})
  }

  return {
    ...acc,
    ...aliases,
  }
}, {})

export const commands: Record<string, Command> = {
  ...originalCommands,
  ...aliases,
}

export const adminCategories: Record<Category, boolean> = {
  Profile: false,
  Defi: false,
  Community: false,
  Config: true,
}

async function preauthorizeCommand(message: Message, commandObject: Command) {
  if (!commandObject) {
    throw new CommandNotFoundError({ message, command: message.content })
  }

  const { checkBeforeRun } = commandObject
  const ableToRun = !checkBeforeRun || (await checkBeforeRun(message))
  if (ableToRun) return

  throw new CommandNotAllowedToRunError({
    message,
    command: message.content,
  })
}

async function executeCommand(
  message: Message,
  commandObject: Command,
  // args: string[],
  action: string,
  isSpecificHelpCommand?: boolean
) {
  // e.g. $help invite || $help invite leaderboard
  if (isSpecificHelpCommand) {
    await message.reply(await commandObject.getHelpMessage(message, action))
    return
  }

  // execute command in `commands`
  const runResponse = await commandObject.run(message, action)
  if (runResponse && runResponse.messageOptions) {
    const output = await message.reply(runResponse.messageOptions)
    if (runResponse.commandChoiceOptions) {
      CommandChoiceManager.add({
        ...runResponse.commandChoiceOptions,
        messageId: output.id,
      })
    }
  }
}

export default async function handlePrefixedCommand(message: Message) {
  try {
    const args = getCommandArguments(message)
    const isSpecificHelpCommand = specificHelpCommand(message)
    const [commandKey, action] = !isSpecificHelpCommand
      ? [args[0].slice(PREFIX.length), args[1]] // e.g. $invite leaderboard
      : [args[1], args[2]] // e.g. $help invite leaderboard
    const commandObject = commands[commandKey]
    logger.info(
      `[${message.guild.name}][${message.author.username}] executing command: ${args}`
    )

    // handle custom commands
    const customCommands = await guildCustomCommand.listGuildCustomCommands(
      message.guildId
    )
    for (let i = 0; i < customCommands.length; i++) {
      if (customCommands[i].id.toLowerCase() === commandKey.toLowerCase()) {
        customCommandsExecute(message, customCommands[i])
        return
      }
    }

    // handle default commands
    await preauthorizeCommand(message, commandObject)
    await config.checkGuildCommandScopes(message, commandObject)
    await executeCommand(message, commandObject, action, isSpecificHelpCommand)
  } catch (e) {
    throw e
  }
}
