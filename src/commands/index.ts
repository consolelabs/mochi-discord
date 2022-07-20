// commands
import help from "./help"
// import invite from "./community/invite"
import profile from "./profile/profile"
import stats from "./community/stats"
import nft from "./community/nft"
import track from "./community/track"
// import gift from "./community/gift"
import deposit from "./defi/deposit"
import tip from "./defi/tip"
import balances from "./defi/balances"
import withdraw from "./defi/withdraw"
// import tokens from "./defi/token"
import ticker from "./defi/ticker"
// import airdrop from "./defi/airdrop"
// import gm from "./community/gm"
// import whitelist from "./community/campaigns"
// import defaultrole from "./config/defaultRole"
// import reactionrole from "./config/reactionRole"
// import starboard from "./config/starboard"
// import top from "./community/top"
import tripod from "./games/tripod"
import levelrole from "./config/levelRole"
import nftrole from "./config/nftRole"
// import globalxp from "./config/globalxp"
// import eventxp from "./config/eventxp"
// import log from "./config/log"

// external
import { Message } from "discord.js"

// internal
import { logger } from "../logger"
import {
  getActionCommand,
  getAllAliases,
  getCommandMetadata,
  specificHelpCommand,
  getCommandArguments,
} from "utils/commands"
import config from "../adapters/config"
import {
  BotBaseError,
  CommandNotAllowedToRunError,
  CommandNotFoundError,
} from "errors"
import guildCustomCommand from "../adapters/guildCustomCommand"
import { customCommandsExecute } from "./customCommand"
import CommandChoiceManager from "utils/CommandChoiceManager"

import { Command, Category } from "types/common"
import { hasAdministrator } from "utils/common"
import ChannelLogger from "utils/ChannelLogger"
import { getErrorEmbed } from "utils/discordEmbed"
import { HELP } from "utils/constants"

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
  // tokens,
  ticker,
  // airdrop,
  // community
  // invite,
  // gm,
  stats,
  nft,
  // gift,
  // top,
  track,
  // config
  // reactionrole,
  // defaultrole,
  // whitelist,
  levelrole,
  nftrole,
  // globalxp,
  // starboard,
  // eventxp,
  // log,
  tripod,
}
export const commands = getAllAliases(originalCommands)

export const adminCategories: Record<Category, boolean> = {
  Profile: false,
  Defi: false,
  Community: false,
  Config: true,
  Game: false,
}

/**
 * Check if command is allowed in DM or need specific permissions to run
 */
async function preauthorizeCommand(message: Message, commandObject: Command) {
  if (!commandObject) {
    throw new CommandNotFoundError({ message, command: message.content })
  }
  const isDM = message.channel.type === "DM"
  const actionObject = getActionCommand(message)
  const executingObj = actionObject ?? commandObject
  if (isDM && executingObj.allowDM) return
  if (!isDM && (!executingObj.onlyAdministrator || hasAdministrator(message)))
    return

  throw new CommandNotAllowedToRunError({
    message,
    command: message.content,
    missingPermissions: isDM ? null : ["Administrator"],
  })
}

/**
 * Check minimum number of arguments and command can run without action
 * If not then reply with help message
 */
function validateCommand(
  cmd: Command,
  args: string[],
  isActionCommand: boolean,
  isSpecificHelpCommand: boolean
) {
  if (isSpecificHelpCommand) return true
  let valid = cmd.canRunWithoutAction || isActionCommand
  valid = valid && args.length >= (cmd.minArguments ?? 0)
  return valid
}

async function executeCommand(
  message: Message,
  commandObject: Command,
  action: string,
  isSpecificHelpCommand?: boolean
) {
  await message.channel.sendTyping()
  // e.g. $help invite || $invite help || $help invite leaderboard
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

async function handleCustomCommands(message: Message, commandKey: string) {
  if (message.channel.type === "DM") return
  const customCommands = await guildCustomCommand.listGuildCustomCommands(
    message.guildId
  )
  for (let i = 0; i < customCommands.length; i++) {
    if (customCommands[i].id.toLowerCase() === commandKey) {
      customCommandsExecute(message, customCommands[i])
      return
    }
  }
}

export default async function handlePrefixedCommand(message: Message) {
  const args = getCommandArguments(message)
  const isSpecificHelpCommand = specificHelpCommand(message)
  const { commandKey, action } = getCommandMetadata(message)
  const commandObject = commands[commandKey]

  logger.info(
    `[${message.guild?.name ?? "DM"}][${
      message.author.username
    }] executing command: ${args}`
  )

  // handle custom commands
  await handleCustomCommands(message, commandKey)

  // handle default commands
  await preauthorizeCommand(message, commandObject)
  await config.checkGuildCommandScopes(message, commandObject)

  const actions = getAllAliases(commandObject.actions)
  const actionObject = actions[action]
  const finalCmd = actionObject ?? commandObject
  const valid = validateCommand(
    finalCmd,
    args,
    !!actionObject,
    isSpecificHelpCommand
  )
  if (!valid) {
    message.content = `${HELP} ${commandKey} ${action ?? ""}`.trimEnd()
    const helpMessage = await finalCmd.getHelpMessage(message, action)
    await message.reply(helpMessage)
    return
  }

  try {
    await executeCommand(message, finalCmd, action, isSpecificHelpCommand)
  } catch (e) {
    const error = e as BotBaseError
    if (error.handle) {
      error.handle()
    } else {
      logger.error(e as string)
      await message.reply({ embeds: [getErrorEmbed({ msg: message })] })
    }
    ChannelLogger.log(error)
  }
}
