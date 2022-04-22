import { Message, MessageOptions } from "discord.js"
import { HELP_CMD, PREFIX } from "utils/constants"
import { logger } from "../logger"
import { help } from "./help"
import invite from "./community/invite/index"
import profile from "./profile"
import verify from "./profile/verify"
import reverify from "./profile/reverify"
import deposit from "./defi/deposit"
import tip from "./defi/tip"
import balances from "./defi/balances"
import withdraw from "./defi/withdraw"
import tokens from "./defi/tokens"
import { getCommandArguments } from "utils/common"
import config from "../adapters/config"
import { CommandNotAllowedToRunError } from "errors"
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

export const allowedDMCommands: Record<string, Command> = Object.entries(
  commands
)
  .filter((c) => c[1].allowedDM)
  .reduce<Record<string, Command>>((acc, cur) => {
    acc[cur[0]] = cur[1]
    return acc
  }, {})

export const adminCategories: Record<Category, boolean> = {
  Profile: false,
  Defi: false,
  Community: false,
  Config: true,
}

async function preauthorizeCommand(message: Message, commandObject: Command) {
  if (!commandObject) return
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
  action: string,
  isAdmin: boolean,
  commandObject: Command
) {
  const runResponse = await commandObject.run(message, action, isAdmin)
  if (runResponse && runResponse.messageOptions) {
    // const output = runResponse.replyOnOriginal
    //   ? await message.reply(runResponse.messageOptions)
    //   : await message.channel.send(runResponse.messageOptions)
    const output = await message.reply(runResponse.messageOptions)
    if (commandObject.isComplexCommand && runResponse.commandChoiceOptions) {
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
    let [command, action] = args
    let commandKey = command.slice(PREFIX.length)

    logger.info(
      `[${message.guild?.name ?? "DM"}][${
        message.author.username
      }] executing command: ${args}`
    )

    if (message.channel.type === "DM" && !allowedDMCommands[commandKey]) {
      return
    }

    // handle help commands
    let data: MessageOptions
    if (message.content === HELP_CMD) {
      // $help
      data = await help(message)
    } else if (command === HELP_CMD) {
      // e.g. $help tip
      data = await commands[action].getHelpMessage(message, args[2]) // e.g. $help invite leaderboard
    }

    if (data) {
      await message.reply(data)
      return
    }

    // run a command e.g. $tick ftm
    const commandObject = commands[commandKey]
    const adminOnly = commandObject && adminCategories[commandObject.category]

    await config.checkGuildCommandScopes(message, commandObject)
    await preauthorizeCommand(message, commandObject)
    await executeCommand(message, action, adminOnly, commandObject)
  } catch (e) {
    throw e
  }
}
