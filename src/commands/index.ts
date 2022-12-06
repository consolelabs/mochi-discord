// commands
import help from "./help"
import invite from "./community/invite"
import profile from "./profile/profile"
import stats from "./community/stats"
import nft from "./community/nft"
import sales from "./community/sales"
import tip from "./defi/tip"
import balances from "./defi/balances"
import deposit from "./defi/deposit"
import withdraw from "./defi/withdraw"
import airdrop from "./defi/airdrop"
import tokens from "./defi/token"
import ticker from "./defi/ticker/ticker"
import gm from "./community/gm"
import defaultrole from "./config/defaultRole"
import reactionrole from "./config/reactionRole"
import starboard from "./config/starboard"
import joinleave from "./config/joinleave"
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
import feedback from "./community/feedback"
import telegram from "./config/telegram"
import swap from "./community/swap"
import quest from "./community/quest"
import statements from "./defi/statements"
import monikers from "./config/moniker"
import transaction from "./transaction"

// slash commands
import help_slash from "./help_slash"
import ticker_slash from "./defi/ticker_slash/ticker_slash"
import log_slash from "./config/log_slash"
import welcome_slash from "./config/welcome_slash"
import watchlist_slash from "./defi/watchlist_slash"
import feedback_slash from "./community/feedback_slash"
import top_slash from "./community/top_slash"
import verify_slash from "./community/verify_slash"
import prune_slash from "./community/prune_slash"
import defaultrole_slash from "./config/defaultRole_slash"
import levelrole_slash from "./config/levelRole_slash"
import reactionrole_slash from "./config/reactionRole_slash"
import nftrole_slash from "./config/nftRole_slash"
import vote_slash from "./community/vote/vote_slash"
import quest_slash from "./community/quest_slash"
import stats_slash from "./community/stats_slash"
import gm_slash from "./community/gm_slash"
import nft_slash from "./community/nft_slash"
import tip_slash from "./defi/tip_bot_slash/tip"
import balances_slash from "./defi/tip_bot_slash/balances"
import statements_slash from "./defi/tip_bot_slash/statements"
import moniker_slash from "./config/moniker_slash"
import withdraw_slash from "./defi/tip_bot_slash/withdraw"
import airdrop_slash from "./defi/tip_bot_slash/airdrop"
import invite_slash from "./community/invite_slash"
import sales_slash from "./community/sales_slash"
import token_slash from "./defi/token_slash"

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
  getCommandSuggestion,
} from "utils/commands"
import config from "../adapters/config"
import { CommandArgumentError, CommandNotAllowedToRunError } from "errors"
// import guildCustomCommand from "../adapters/guildCustomCommand"
// import { customCommandsExecute } from "./customCommand"
import { Command, Category, SlashCommand } from "types/common"
import { getEmoji, hasAdministrator } from "utils/common"
import { HELP } from "utils/constants"
import CacheManager from "utils/CacheManager"
import community from "adapters/community"
import usage_stats from "adapters/usage_stats"
import { isAcceptableCmdToHelp } from "./index-utils"
import FuzzySet from "fuzzyset"
import {
  composeDiscordExitButton,
  composeDiscordSelectionRow,
  composeEmbedMessage,
  getMultipleResultEmbed,
  setDefaultMiddleware,
} from "utils/discordEmbed"
import { EXPERIMENTAL_CATEGORY_CHANNEL_IDS } from "env"
import InteractionManager from "utils/InteractionManager"

CacheManager.init({ pool: "vote", ttl: 0, checkperiod: 300 })
CacheManager.init({
  ttl: 0,
  pool: "imagepool",
  checkperiod: 3600,
})

export const slashCommands: Record<string, SlashCommand> = {
  feedback: feedback_slash,
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
  reactionrole: reactionrole_slash,
  nftrole: nftrole_slash,
  prune: prune_slash,
  quest: quest_slash,
  stats: stats_slash,
  gm: gm_slash,
  nft: nft_slash,
  tip: tip_slash,
  balances: balances_slash,
  statements: statements_slash,
  monikers: moniker_slash,
  withdraw: withdraw_slash,
  airdrop: airdrop_slash,
  invite: invite_slash,
  sales: sales_slash,
  token: token_slash,
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
  airdrop,
  tokens,
  ticker,
  watchlist,
  statements,
  transaction,
  // community section
  swap,
  invite,
  gm,
  stats,
  nft,
  top,
  sales,
  verify,
  vote,
  feedback,
  prune,
  quest,
  // config section
  reactionrole,
  defaultrole,
  joinleave,
  monikers,
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
  const actionObject = getActionCommand(commands, message)
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
  const benchmarkStart = process.hrtime()

  await message.channel.sendTyping()
  // e.g. $help invite || $invite help || $help invite leaderboard
  if (isSpecificHelpCommand) {
    const helpMessage = await commandObject.getHelpMessage(message, action)
    if (helpMessage && Object.keys(helpMessage).length) {
      await message.reply(helpMessage)

      // stop benchmark for help message
      const benchmarkStop = process.hrtime(benchmarkStart)
      // send command to server to store
      usage_stats.createUsageStat({
        guild_id: message.guildId !== null ? message.guildId : "DM",
        user_id: message.author.id,
        command: "help",
        args: message.content,
        execution_time_ms: Math.round(benchmarkStop[1] / 1000000),
        success: true,
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
  const reminderEmbed = composeEmbedMessage(message, {
    title: "Vote for Mochi!",
    description: `Vote for Mochi to gain rewards. Run \`$vote\` now! ${getEmoji(
      "CLAIM"
    )}`,
  })
  // execute command in `commands`
  const runResponse = await commandObject.run(message, action)
  if (runResponse) {
    if ("messageOptions" in runResponse) {
      if (shouldRemind && Math.random() < 0.1) {
        runResponse.messageOptions.embeds?.push(reminderEmbed)
      }
      const msg = await message.reply({
        ...runResponse.messageOptions,
      })
      if (runResponse.interactionOptions && msg) {
        InteractionManager.add(msg.id, runResponse.interactionOptions)
      }
    } else if ("select" in runResponse) {
      // ask default case
      const {
        ambiguousResultText,
        multipleResultText,
        select,
        onDefaultSet,
        render,
      } = runResponse
      const multipleEmbed = getMultipleResultEmbed({
        msg: message,
        ambiguousResultText,
        multipleResultText,
      })
      const selectRow = composeDiscordSelectionRow({
        customId: `mutliple-results-${message.id}`,
        ...select,
      })
      const msg = await message.reply({
        embeds: [multipleEmbed],
        components: [selectRow, composeDiscordExitButton(message.author.id)],
      })

      if (render) {
        InteractionManager.add(msg.id, {
          handler: setDefaultMiddleware<Message>({
            onDefaultSet,
            label: ambiguousResultText,
            render,
          }),
        })
      }
    }
  }

  // stop benchmark for commands
  const benchmarkStop = process.hrtime(benchmarkStart)
  // send command to server to store
  usage_stats.createUsageStat({
    guild_id: message.guildId !== null ? message.guildId : "DM",
    user_id: message.author.id,
    command: commandObject.id,
    args: message.content,
    execution_time_ms: Math.round(benchmarkStop[1] / 1000000),
    success: true,
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
  const { commandKey, action = "" } = getCommandMetadata(commands, message)

  if (!commandKey) return

  // handle custom commands
  // await handleCustomCommands(message, commandKey)

  const commandObject = commands[commandKey]

  // send suggest embed if command not found
  if (commandObject === undefined) {
    const embedProps = getCommandSuggestion(fuzzySet, commandKey, commands)
    if (embedProps) {
      await message
        .reply({
          embeds: [composeEmbedMessage(message, embedProps)],
        })
        .catch(() => null)
    }
    return
  }

  // if this command is experimental -> only allow it to run inside certain channels
  if (commandObject.experimental) {
    const isTextChannel = message.channel.type === "GUILD_TEXT"
    if (!isTextChannel) return
    const parentId = message.channel.parentId
    if (!parentId || !EXPERIMENTAL_CATEGORY_CHANNEL_IDS.includes(parentId))
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
