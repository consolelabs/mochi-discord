import { Message } from "discord.js"
import { PREFIX } from "utils/constants"
import { logger } from "../logger"
import help from "./help"
import invite from "./community/invite"
import profile from "./profile/profile"
import stats from "./community/stats"
import nft from "./community/nft"
import sales from "./community/sales"
import gift from "./community/gift"
import deposit from "./defi/deposit"
import tip from "./defi/tip"
import balances from "./defi/balances"
import withdraw from "./defi/withdraw"
import tokens from "./defi/token"
import { getActionCommand, getAllAliases } from "utils/commands"
import { specificHelpCommand } from "utils/commands"
import config from "../adapters/config"
import {
  BotBaseError,
  CommandNotAllowedToRunError,
  CommandNotFoundError,
} from "errors"
import guildCustomCommand from "../adapters/guildCustomCommand"
import { customCommandsExecute } from "./customCommand"
import CommandChoiceManager from "utils/CommandChoiceManager"
import ticker from "./defi/ticker"
import airdrop from "./defi/airdrop"
import channel from "./config/channel"
import chat from "./community/chat"
import gm from "./community/gm"
import whitelist from "./community/campaigns"
import defaultrole from "./config/defaultRole"
import reactionrole from "./config/reactionRole"
import starboard from "./config/starboard"
import top from "./community/top"
import levelrole from "./config/levelRole"
import nftrole from "./config/nftRole"
import globalxp from "./config/globalxp"
import eventxp from "./config/eventxp"
import log from "./config/log"
import testdemo from "./renderSalesMessage"
import { Command, Category } from "types/common"
import { getCommandArguments } from "utils/commands"
import { hasAdministrator } from "utils/common"
import ChannelLogger from "utils/ChannelLogger"
import { getErrorEmbed } from "utils/discordEmbed"

export const originalCommands: Record<string, Command> = {
  // general help
  help,
  // profile
  profile,
  testdemo,
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
  gift,
  top,
  sales,
  // config
  channel,
  reactionrole,
  defaultrole,
  whitelist,
  levelrole,
  nftrole,
  globalxp,
  starboard,
  eventxp,
  log,
}

export const commands = getAllAliases(originalCommands)

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

async function executeCommand(
  message: Message,
  commandObject: Command,
  // args: string[],
  action: string,
  isSpecificHelpCommand?: boolean
) {
  await message.channel.sendTyping()

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
  const args = getCommandArguments(message)
  const isSpecificHelpCommand = specificHelpCommand(message)
  const [commandKey, action] = !isSpecificHelpCommand
    ? [args[0].slice(PREFIX.length), args[1]] // e.g. $invite leaderboard
    : [args[1], args[2]] // e.g. $help invite leaderboard
  const commandObject = commands[commandKey]

  logger.info(
    `[${message.guild?.name ?? "DM"}][${
      message.author.username
    }] executing command: ${args}`
  )

  // handle custom commands
  if (message.channel.type !== "DM") {
    const customCommands = await guildCustomCommand.listGuildCustomCommands(
      message.guildId
    )
    for (let i = 0; i < customCommands.length; i++) {
      if (customCommands[i].id.toLowerCase() === commandKey.toLowerCase()) {
        customCommandsExecute(message, customCommands[i])
        return
      }
    }
  }

  // handle default commands
  await preauthorizeCommand(message, commandObject)
  await config.checkGuildCommandScopes(message, commandObject)

  try {
    await executeCommand(message, commandObject, action, isSpecificHelpCommand)
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
