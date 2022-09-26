// commands
import help from "./help"
import invite from "./community/invite"
import profile from "./profile/profile"
import stats from "./community/stats"
import nft from "./community/nft"
import sales from "./community/sales"
import deposit from "./defi/deposit"
import tip from "./defi/tip"
import balances from "./defi/balances"
import withdraw from "./defi/withdraw"
import tokens from "./defi/token"
import ticker from "./defi/ticker"
import airdrop from "./defi/airdrop"
import gm from "./community/gm"
import defaultrole from "./config/defaultRole"
import reactionrole from "./config/reactionRole"
import starboard from "./config/starboard"
import top from "./community/top"
import prune from "./community/prune"
import tripod from "./games/tripod"
import levelrole from "./config/levelRole"
import nftrole from "./config/nftRole"
// import globalxp from "./config/globalxp"
// import eventxp from "./config/eventxp"
import verify from "./community/verify"
import log from "./config/log"
import poe from "./config/poe"
import watchlist from "./defi/watchlist"
import vote from "./community/vote"
import telegram from "./config/telegram"

// slash commands
import help_slash from "./help_slash"
import ticker_slash from "./defi/ticker_slash"
import log_slash from "./config/log_slash"
import welcome_slash from "./config/welcome_slash"
import watchlist_slash from "./defi/watchlist_slash"
import top_slash from "./community/top_slash"
import verify_slash from "./community/verify_slash"
import prune_slash from "./community/prune_slash"
import defaultrole_slash from "./config/defaultRole_slash"
import levelrole_slash from "./config/levelRole_slash"
import vote_slash from "./community/vote/vote_slash"

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
  sendCommandSuggestionMessage,
} from "utils/commands"
import config from "../adapters/config"
import { CommandArgumentError, CommandNotAllowedToRunError } from "errors"
// import guildCustomCommand from "../adapters/guildCustomCommand"
// import { customCommandsExecute } from "./customCommand"
import CommandChoiceManager from "utils/CommandChoiceManager"
import { Command, Category, SlashCommand } from "types/common"
import { hasAdministrator } from "utils/common"
import { HELP } from "utils/constants"
import CacheManager from "utils/CacheManager"
import community from "adapters/community"
import usage_stats from "adapters/usage_stats"
import { isAcceptableCmdToHelp } from "./index-utils"
import FuzzySet from "fuzzyset"

CacheManager.init({ pool: "vote", ttl: 0, checkperiod: 300 })

export const slashCommands: Record<string, SlashCommand> = {
  ticker: ticker_slash,
  help: help_slash,
  log: log_slash,
  welcome: welcome_slash,
  top: top_slash,
  verify: verify_slash,
  vote: vote_slash,
  watchlist: watchlist_slash,
  defaultrole: defaultrole_slash,
  levelrole: levelrole_slash,
  prune: prune_slash,
}

export const originalCommands: Record<string, Command> = {
  // general help
  help,
  // profile section
  profile,
  // defi section
  deposit,
  tip,
  balances,
  withdraw,
  tokens,
  ticker,
  airdrop,
  watchlist,
  // community section
  invite,
  gm,
  stats,
  nft,
  top,
  sales,
  verify,
  vote,
  prune,
  // config section
  reactionrole,
  defaultrole,
  // whitelist,
  levelrole,
  nftrole,
  // globalxp,
  starboard,
  // eventxp,
  log,
  poe,
  telegram,
  // games section
  tripod,
}
export const commands = getAllAliases(originalCommands)
export const fuzzySet = FuzzySet(Object.keys(commands))
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
    return
  }
  const isDM = message.channel.type === "DM"
  const actionObject = getActionCommand(message)
  const executingObj = actionObject ?? commandObject
  if (isDM && executingObj.allowDM) return
  const isAdminMember = message.member && hasAdministrator(message.member)
  if (!isDM && (!executingObj.onlyAdministrator || isAdminMember)) return

  throw new CommandNotAllowedToRunError({
    message,
    command: message.content,
    missingPermissions: isDM ? undefined : ["Administrator"],
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
    const helpMessage = await commandObject.getHelpMessage(message, action)
    if (helpMessage) {
      await message.reply(helpMessage)
      // send command to server to store
      usage_stats.createUsageStat({
        guild_id: message.guildId !== null ? message.guildId : "DM",
        user_id: message.author.id,
        command: "help",
        args: message.content,
      })
    }
    return
  }

  let shouldRemind = await CacheManager.get({
    pool: "vote",
    key: `remind-${message.author.id}-vote-again`,
    // 5 min
    ttl: 300,
    call: async () => {
      const res = await community.getUpvoteStreak(message.author.id)
      let ttl = 0
      let shouldRemind = true
      if (res.ok) {
        const timeUntilTopgg = res.data?.minutes_until_reset_topgg ?? 0
        const timeUntilDiscordBotList =
          res.data?.minutes_until_reset_discordbotlist ?? 0
        ttl = Math.max(timeUntilTopgg, timeUntilDiscordBotList)
        shouldRemind = ttl === 0
      }
      return shouldRemind
    },
  })
  if (commandObject.id === "vote") {
    // user is already using $vote, no point in reminding
    shouldRemind = false
  }

  // execute command in `commands`
  const runResponse = await commandObject.run(message, action)
  if (runResponse && runResponse.messageOptions) {
    const output = await message.reply({
      ...(shouldRemind && Math.random() < 0.3
        ? { content: "> 👋 Psst! You can vote now, try `$vote`. 😉" }
        : {}),
      ...runResponse.messageOptions,
    })
    if (runResponse.commandChoiceOptions) {
      CommandChoiceManager.add({
        ...runResponse.commandChoiceOptions,
        messageId: output.id,
      })
    }
  }
  // send command to server to store
  usage_stats.createUsageStat({
    guild_id: message.guildId !== null ? message.guildId : "DM",
    user_id: message.author.id,
    command: commandObject.id,
    args: message.content,
  })
}

// async function handleCustomCommands(message: Message, commandKey: string) {
//   if (message.channel.type === "DM") return
//   if (message.guildId == null) return
//   const customCommands = await guildCustomCommand.listGuildCustomCommands(
//     message.guildId
//   )
//   for (let i = 0; i < customCommands.length; i++) {
//     if (customCommands[i].id.toLowerCase() === commandKey) {
//       customCommandsExecute(message, customCommands[i])
//       return
//     }
//   }
// }

export default async function handlePrefixedCommand(message: Message) {
  const args = getCommandArguments(message)
  logger.info(
    `[${message.guild?.name ?? "DM"}][${
      message.author.username
    }] executing command: ${args}`
  )

  let isSpecificHelpCommand = specificHelpCommand(message)
  const { commandKey, action = "" } = getCommandMetadata(message)

  if (!commandKey) return

  // handle custom commands
  // await handleCustomCommands(message, commandKey)

  const commandObject = commands[commandKey]

  // send suggest embed if command not found
  if (commandObject === undefined) {
    sendCommandSuggestionMessage(commandKey, commands, message)
    return
  }
  // handle default commands
  await preauthorizeCommand(message, commandObject)
  await config.checkGuildCommandScopes(message, commandObject)

  const actions = getAllAliases(commandObject.actions)
  const actionObject = actions[action]
  const finalCmd = actionObject ?? commandObject

  const shouldShowHelp = isAcceptableCmdToHelp(
    commandObject.command,
    commandObject.aliases ?? [],
    actionObject?.command ?? "",
    message.content
  )
  const valid = validateCommand(
    finalCmd,
    args,
    !!actionObject,
    isSpecificHelpCommand ?? false
  )
  if (shouldShowHelp && !valid) {
    message.content = `${HELP} ${commandKey} ${action}`.trimEnd()
    isSpecificHelpCommand = true
  } else if (!valid) {
    throw new CommandArgumentError({
      message: message,
      getHelpMessage: () => finalCmd.getHelpMessage(message, action),
    })
  }

  await executeCommand(
    message,
    finalCmd,
    action,
    isSpecificHelpCommand ?? false
  )
}
