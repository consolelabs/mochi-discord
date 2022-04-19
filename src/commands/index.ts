import { Message } from "discord.js"
import { HELP_CMD, PREFIX } from "utils/constants"
import { logger } from "../logger"
import { help } from "./help"
import invite from "./community/invite"
import profile from "./profile"
import verify from "./profile/verify"
import reverify from "./profile/reverify"
import deposit from "./defi/deposit"
import tip from "./defi/tip"
import balances from "./defi/balances"
import withdraw from "./defi/withdraw"
import tokens from "./defi/tokens"
import {
  getCommandArguments,
  onlyAdminsAllowed,
} from "utils/common"
import config from "../adapter/config"
import { CommandNotAllowedToRunError, CommandNotFoundError } from "errors"
import CommandChoiceManager from "utils/CommandChoiceManager"
import ticker from "./defi/ticker"
import airdrop from "./defi/airdrop"
import reaction from "./config/reaction"
import channel from "./config/channel"
import chat from "./community/chat"
import { Command, Category } from "types/common"

export const originalCommands: Record<string, Command> = {
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

async function preauthorizeCommand(
  message: Message,
  commandObject: Command,
  onlyAdmin?: boolean
) {
  let ableToRun = true
  if (onlyAdmin) {
    ableToRun = await onlyAdminsAllowed(message)
  } else {
    if (!commandObject) return
    const { checkBeforeRun } = commandObject
    if (checkBeforeRun) {
      ableToRun = await checkBeforeRun(message)
    }
  }
  if (!ableToRun) {
    throw new CommandNotAllowedToRunError({
      message,
      command: message.content,
    })
  }
}

async function executeCommand(
  message: Message,
  action: string,
  isAdmin: boolean,
  commandObject: Command
) {
  const runResponse = await commandObject.run(message, action, isAdmin)
  if (runResponse && runResponse.messageOptions) {
    const output = runResponse.replyOnOriginal
      ? await message.reply(runResponse.messageOptions)
      : await message.channel.send(runResponse.messageOptions)
    if (commandObject.isComplexCommand && runResponse.commandChoiceOptions) {
      CommandChoiceManager.add({
        ...runResponse.commandChoiceOptions,
        messageId: output.id,
      })
    }
  }
}

export default async function handleCommand(message: Message) {
  try {
    const args = getCommandArguments(message)
    const helpCommand = message.content === HELP_CMD

    logger.info(
      `[${message.guild?.name ?? "DM"}][${
        message.author.username
      }] executing command: ${args}`
    )

    let cmd = args[0]
    let action = args[1]
    let commandObject = commands[cmd.slice(PREFIX.length)]

    // show help message if invoking command without action is not supported
    if (!action && commandObject && !commandObject.canRunWithoutAction) {
      cmd = HELP_CMD
    }
    commandObject = !commandObject && action ? commands[action] : commandObject
    // const isAdminCommand = cmd.startsWith(ADMIN_PREFIX)
    const adminOnly = commandObject && adminCategories[commandObject.category]

    switch (true) {
      // return general help message
      case helpCommand: {
        let data
        await preauthorizeCommand(message, commandObject)
        data = await help(message)
        await message.reply(data)
        break
      }
      // execute a specific command's 'help()
      case cmd === HELP_CMD: {
        if (!commandObject) {
          throw new CommandNotFoundError({
            message,
            command: message.content,
          })
        }
        await config.checkGuildCommandScopes(message, commandObject)
        await preauthorizeCommand(message, commandObject, adminOnly)

        const data = await commandObject.getHelpMessage(
          message,
          args[2],
          adminOnly
        )
        await message.channel.send(data)
        break
      }
      // execute command's run()
      case Boolean(commandObject):
        await config.checkGuildCommandScopes(message, commandObject)
        await preauthorizeCommand(message, commandObject)
        await executeCommand(message, action, adminOnly, commandObject)
        break
      default:
        throw new CommandNotFoundError({
          message,
          command: message.content,
        })
    }
  } catch (e) {
    throw e
  }
}
