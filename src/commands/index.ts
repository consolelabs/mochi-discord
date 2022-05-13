import { Message } from "discord.js"
import { PREFIX } from "utils/constants"
import { logger } from "../logger"
import help from "./help"
import invite from "./community/invite/index"
import profile from "./profile"
import stats from "./community/stats"
import nft from "./community/nft"
import deposit from "./defi/deposit"
import tip from "./defi/tip"
import balances from "./defi/balances"
import withdraw from "./defi/withdraw"
import tokens from "./defi/token"
import { getActionCommand, getAllAliases } from "utils/commands"
import { specificHelpCommand } from "utils/commands"
import config from "../adapters/config"
import { CommandNotAllowedToRunError, CommandNotFoundError } from "errors"
import guildCustomCommand from "../modules/guildCustomCommand"
import { customCommandsExecute } from "./customCommand"
import CommandChoiceManager from "utils/CommandChoiceManager"
import ticker from "./defi/ticker"
import airdrop from "./defi/airdrop"
import channel from "./config/channel"
import chat from "./community/chat"
import gm from "./community/gm"
import defaultrole from "./config/defaultRole"
import reactionrole from "./config/reactionRole"
import top from "./community/top"
import { Command, Category } from "types/common"
import { getCommandArguments } from "utils/commands"
import { hasAdministrator } from "utils/common"

export const originalCommands: Record<string, Command> = {
  // general help
  help,
  // profile
  profile,
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
  stats,
  nft,
	top,
  // config
  channel,
  reactionrole,
  defaultrole
}

export const commands: Record<string, Command> = getAllAliases(originalCommands)

export const adminCategories: Record<Category, boolean> = {
  Profile: false,
  Defi: false,
  Community: false,
  Config: true
}

async function preauthorizeCommand(message: Message, commandObject: Command) {
  if (!commandObject) {
    throw new CommandNotFoundError({ message, command: message.content })
  }

  const actionObject = getActionCommand(message)
  if (
    !(actionObject ?? commandObject).onlyAdministrator ||
    hasAdministrator(message)
  )
    return

  throw new CommandNotAllowedToRunError({
    message,
    command: message.content,
    missingPermissions: ["Administrator"]
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
        messageId: output.id
      })
    }
  }
}

export default async function handlePrefixedCommand(message: Message) {
  try {
		await message.channel.sendTyping()
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
