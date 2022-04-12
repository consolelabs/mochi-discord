import { Message, MessageOptions } from "discord.js"
import { ADMIN_PREFIX, PREFIX, SECONDARY_PREFIX } from "../env"
import { logger } from "../logger"
import { adminHelpMessage, help } from "./help"
import invite from "./invite"
import profile from "./profile"
import verify from "./verify"
import reverify from "./reverify"
// import hnb from "./hit-and-blow"
import deposit from "./deposit"
import tip from "./tip"
import balances from "./balances"
import withdraw from "./withdraw"
import tokens from "./tokens"
import portfolio from "./portfolio"
import twitter from "./twitter"
import xp from "./xp"
import gm, { newGm } from "./gm"
import { onlyRunInAdminGroup } from "utils/discord"
import guildConfig from "../modules/guildConfig"
import {
  CommandIsNotScopedError,
  CommandNotAllowedToRunError,
  CommandNotFoundError,
} from "errors"
import { FactsAndTipsManager } from "utils/FactsAndTipsManager"
import CommandChoiceManager, {
  CommandChoiceHandlerOptions,
} from "utils/CommandChoiceManager"
import { SetOptional } from "type-fest"
import { sendVerifyMessage } from "./send-verify-message"
import ticker from "./ticker"
import airdrop from "./airdrop"

// Category of commands
export type Category =
  | "Admin"
  | "Profile"
  | "Leaderboard"
  | "Council"
  | "Games"
  | "Social"

// All command must conform to this type
export type Command = {
  id: string
  command: string
  category: Category
  name: string
  checkBeforeRun?: (msg: Message) => Promise<boolean>
  run: (
    msg: Message,
    action?: string,
    isAdmin?: boolean
  ) => Promise<{
    messageOptions: MessageOptions
    commandChoiceOptions?: SetOptional<CommandChoiceHandlerOptions, "messageId">
    replyOnOriginal?: boolean
  } | void>
  getHelpMessage: (
    msg: Message,
    action?: string,
    isAdmin?: boolean
  ) => Promise<MessageOptions>
  alias?: string[]
  canRunWithoutAction?: boolean
  // can only run in admin channels & won't be shown in `p!help` message
  experimental?: boolean
  inactivityTimeout?: number
  isComplexCommand?: boolean
}

export const originalCommands: Record<string, Command> = {
  invite,
  profile,
  verify,
  reverify,
  deposit,
  tip,
  balances,
  withdraw,
  tokens,
  portfolio,
  twitter,
  xp,
  gm,
  ticker,
  airdrop,
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

const commands: Record<string, Command> = {
  ...originalCommands,
  ...aliases,
}

export default async function handleCommand(message: Message) {
  // let loading
  try {
    const messageContent = message.content.toLowerCase()
    const args = messageContent.split(" ")
    const helpCommand =
      (messageContent === `${PREFIX}help` ||
        messageContent === `${ADMIN_PREFIX}help` ||
        messageContent === `${SECONDARY_PREFIX}help`) &&
      args.length === 1

    const isGmMessage =
      messageContent === "gm" ||
      messageContent === "gn" ||
      messageContent === "<:gm:930840080761880626>" ||
      (message.stickers.get("928509218171006986") &&
        message.stickers.get("928509218171006986").name === ":gm")

    logger.info(
      `[${message.guild.name}][${message.author.username}] executing command: ${args}`
    )

    let cmd = args[0]
    let action = args[1]

    let commandObject =
      commands[cmd.slice(cmd.startsWith(SECONDARY_PREFIX) ? 1 : 2)]

    // show help message if invoke command with no action
    if (!action && commandObject && !commandObject.canRunWithoutAction) {
      cmd = `${commandObject.category === "Admin" ? ADMIN_PREFIX : PREFIX}help`
    }

    if (!commandObject) {
      commandObject = commands[action]
    }

    switch (true) {
      case isGmMessage:
        await newGm(message)
        break
      case cmd === `${ADMIN_PREFIX}send-verify-message`:
        await sendVerifyMessage(message, action)
        break
      case helpCommand: {
        let data
        if (cmd === `${ADMIN_PREFIX}help`) {
          const ableToRun = await onlyRunInAdminGroup(message)
          if (!ableToRun) {
            throw new CommandNotAllowedToRunError({
              message,
              command: message.content,
            })
          }
          // loading = await message.channel.send({
          //   embeds: [await getLoadingEmbed(message)],
          // })
          data = await adminHelpMessage(message)
        } else {
          // loading = await message.channel.send({
          //   embeds: [await getLoadingEmbed(message)],
          // })
          data = await help(message)
        }
        await message.reply(data)
        // await message.channel.send(data)
        // loading.delete()
        break
      }
      case cmd === `${PREFIX}help` ||
        cmd === `${SECONDARY_PREFIX}help` ||
        cmd === `${ADMIN_PREFIX}help`: {
        if (!commandObject) {
          throw new CommandNotFoundError({
            message,
            command: message.content,
          })
        }
        // check if command is scoped to guild
        const isScoped = await guildConfig.commandIsScoped(
          message.guildId,
          commandObject.category,
          commandObject.command
        )
        if (!isScoped) {
          throw new CommandIsNotScopedError({
            message,
            category: commandObject.category.toLowerCase(),
            command: commandObject.command.toLowerCase(),
          })
        }
        if (
          commandObject.category === "Admin" ||
          cmd === `${ADMIN_PREFIX}help`
        ) {
          const ableToRun = await onlyRunInAdminGroup(message)
          if (!ableToRun) {
            throw new CommandNotAllowedToRunError({
              message,
              command: message.content,
            })
          }
        }
        // the real action to display help message
        // e.g `p!help tg pools`
        //                 ^
        //               action
        // loading = await message.channel.send({
        //   embeds: [await getLoadingEmbed(message)],
        // })
        action = args[2]
        const data = await commandObject.getHelpMessage(
          message,
          action,
          cmd === `${ADMIN_PREFIX}help`
        )
        await message.channel.send(data)
        // loading.delete()
        break
      }
      case Boolean(commandObject):
        // check if command is scoped to guild
        const isScoped = await guildConfig.commandIsScoped(
          message.guildId,
          commandObject.category,
          commandObject.command
        )
        if (!isScoped) {
          throw new CommandIsNotScopedError({
            message,
            category: commandObject.category.toLowerCase(),
            command: commandObject.command.toLowerCase(),
          })
        }

        let ableToRun = true
        const checkBeforeRun = commandObject.checkBeforeRun
        if (checkBeforeRun) {
          ableToRun = await checkBeforeRun(message)
        }
        if (ableToRun) {
          // loading = await message.channel.send({
          //   embeds: [await getLoadingEmbed(message)],
          // })
          const runResponse = await commandObject.run(
            message,
            action,
            cmd.startsWith(ADMIN_PREFIX)
          )
          if (runResponse && runResponse.messageOptions) {
            const output = runResponse.replyOnOriginal
              ? await message.reply(runResponse.messageOptions)
              : await message.channel.send(runResponse.messageOptions)
            if (
              commandObject.isComplexCommand &&
              runResponse.commandChoiceOptions
            ) {
              CommandChoiceManager.add({
                ...runResponse.commandChoiceOptions,
                messageId: output.id,
              })
            }
          }
          // loading.delete()
        } else {
          throw new CommandNotAllowedToRunError({
            message,
            command: message.content,
          })
        }
        break
      default:
        throw new CommandNotFoundError({
          message,
          command: message.content,
        })
    }
  } catch (e) {
    // this try catch is just for clearing the loading msg, real error handling is propagated to the upper level
    // loading?.delete().catch(() => {})
    throw e
  }
}
