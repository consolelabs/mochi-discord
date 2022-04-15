import { Message } from "discord.js"
import { ADMIN_HELP_CMD, ADMIN_PREFIX, HELP_CMD, PREFIX } from "utils/constants"
import { logger } from "../logger"
import { adminHelpMessage, help } from "./help"
import invite from "./community/invite"
import profile from "./profile"
import verify from "./profile/verify"
import reverify from "./profile/reverify"
import deposit from "./defi/deposit"
import tip from "./defi/tip"
import balances from "./defi/balances"
import withdraw from "./defi/withdraw"
import tokens from "./defi/tokens"
import twitter from "./profile/twitter"
import gm, { newGm } from "./community/gm"
import {
  getCommandArguments,
  isGmMessage,
  onlyRunInAdminGroup,
} from "utils/common"
import guildConfig from "../modules/guildConfig"
import { CommandNotAllowedToRunError, CommandNotFoundError } from "errors"
import { FactsAndTipsManager } from "utils/FactsAndTipsManager"
import CommandChoiceManager from "utils/CommandChoiceManager"
import { sendVerifyMessage } from "./profile/send-verify-message"
import ticker from "./defi/ticker"
import airdrop from "./defi/airdrop"
import reaction from "./config/reaction"
import channel from "./config/channel"
import chat from "./community/chat"
import { Command } from "types/common"

export const originalCommands: Record<string, Command> = {
  // profile
  profile,
  verify,
  reverify,
  twitter,
  // defi
  deposit,
  tip,
  balances,
  withdraw,
  tokens,
  ticker,
  airdrop,
  // community
  gm,
  invite,
  chat,
  // config
  reaction,
  channel,
}

export const factsAndTipsManager = new FactsAndTipsManager(originalCommands)

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

const helpCommands = [HELP_CMD, ADMIN_HELP_CMD]

async function preauthorizeCommand(
  message: Message,
  commandObject: Command,
  onlyAdmin?: boolean
) {
  let ableToRun = true
  if (onlyAdmin) {
    ableToRun = await onlyRunInAdminGroup(message)
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
    const helpCommand = helpCommands.includes(message.content)

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
      cmd = commandObject.category === "Admin" ? ADMIN_HELP_CMD : HELP_CMD
    }
    commandObject = !commandObject && action ? commands[action] : commandObject
    const isAdminCommand = cmd.startsWith(ADMIN_PREFIX)

    switch (true) {
      // gm/gn
      case isGmMessage(message):
        await newGm(message)
        break
      case cmd === `${ADMIN_PREFIX}send-verify-message`:
        await sendVerifyMessage(message, action)
        break
      // return general help message
      case helpCommand: {
        let data
        await preauthorizeCommand(message, commandObject, isAdminCommand)
        data = await (isAdminCommand
          ? adminHelpMessage(message)
          : help(message))
        await message.reply(data)
        break
      }
      // execute a specific command's 'help()
      case helpCommands.includes(cmd): {
        if (!commandObject) {
          throw new CommandNotFoundError({
            message,
            command: message.content,
          })
        }
        await guildConfig.checkGuildCommandScopes(message, commandObject)
        if (commandObject.category === "Admin" || isAdminCommand) {
          await preauthorizeCommand(message, commandObject, true)
        }

        const data = await commandObject.getHelpMessage(
          message,
          args[2],
          isAdminCommand
        )
        await message.channel.send(data)
        break
      }
      // execute command's run()
      case Boolean(commandObject):
        await guildConfig.checkGuildCommandScopes(message, commandObject)
        await preauthorizeCommand(message, commandObject)
        await executeCommand(
          message,
          action,
          cmd.startsWith(ADMIN_PREFIX),
          commandObject
        )
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
