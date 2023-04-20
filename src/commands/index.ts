// external
import { ButtonInteraction, Message } from "discord.js"
import FuzzySet from "fuzzyset"

// internal
import CacheManager from "cache/node-cache"
import { EXPERIMENTAL_CATEGORY_CHANNEL_IDS } from "env"
import { CommandArgumentError, CommandNotAllowedToRunError } from "errors"
import InteractionManager from "handlers/discord/select-menu"
import {
  Category,
  Command,
  KafkaQueueMessage,
  SlashCommand,
} from "types/common"
import {
  getActionCommand,
  getAllAliases,
  getCommandArguments,
  getCommandMetadata,
} from "utils/commands"
import { authorFilter, getChance, hasAdministrator } from "utils/common"
import { HELP } from "utils/constants"
import Config from "../adapters/config"
import { logger } from "../logger"
import { isAcceptableCmdToHelp } from "../utils/commands"

// commands
import { MessageComponentTypes } from "discord.js/typings/enums"
import { kafkaQueue } from "queue/kafka/queue"
import { composeButtonLink, composeDiscordExitButton } from "ui/discord/button"
import {
  composeEmbedMessage,
  composePartnerEmbedPimp,
  getCommandSuggestion,
  getMultipleResultEmbed,
} from "ui/discord/embed"
import {
  composeDiscordSelectionRow,
  setDefaultMiddleware,
} from "ui/discord/select-menu"
import airdrop from "./airdrop"
import balances from "./balances"
import claim from "./claim"
import proposal from "./proposal"
import defaultrole from "./default-role"
import deposit from "./deposit"
import feedback from "./feedback/index"
import gm from "./gm"
import help from "./help/index"
import levelmessage from "./level-message"
import levelrole from "./level-role"
import log from "./log"
import moniker from "./moniker"
import gas from "./gas"
import activity from "./activity"
import inbox from "./inbox"
import nft from "./nft"
import nftrole from "./nft-role"
import poe from "./poe"
import profile from "./profile"
import prune from "./prune"
import quest from "./quest"
import reactionrole from "./reaction-role"
import sales from "./sales"
import sendxp from "./sendxp"
import starboard from "./starboard"
import statements from "./statements"
import telegram from "./telegram"
import ticker from "./ticker"
import tip from "./tip"
import token from "./token"
import top from "./top"
import verify from "./verify"
import watchlist from "./watchlist"
import welcome from "./welcome/index"
import withdraw from "./withdraw"
import tokenrole from "./token-role"
import xprole from "./xp-role"
import wallet from "./wallet"
import mixrole from "./mix-role"
import alert from "./alert"
import stats from "./stats"
import game from "./game"
import pay from "./pay"
import convert from "./convert"
import vault from "./vault"
import config from "./config"
import heatmap from "./heatmap"
import swap from "./swap"
import tagme from "./tagme"
import trending from "./trending"

CacheManager.init({
  ttl: 0,
  pool: "imagepool",
  checkperiod: 3600,
})

export const slashCommands: Record<string, SlashCommand> = {
  feedback: feedback.slashCmd,
  ticker: ticker.slashCmd,
  help: help.slashCmd,
  log: log.slashCmd,
  welcome: welcome.slashCmd,
  top: top.slashCmd,
  verify: verify.slashCmd,
  watchlist: watchlist.slashCmd,
  defaultrole: defaultrole.slashCmd,
  levelrole: levelrole.slashCmd,
  reactionrole: reactionrole.slashCmd,
  nftrole: nftrole.slashCmd,
  prune: prune.slashCmd,
  quest: quest.slashCmd,
  gm: gm.slashCmd,
  nft: nft.slashCmd,
  tip: tip.slashCmd,
  balances: balances.slashCmd,
  statements: statements.slashCmd,
  proposal: proposal.slashCmd,
  moniker: moniker.slashCmd,
  withdraw: withdraw.slashCmd,
  airdrop: airdrop.slashCmd,
  sales: sales.slashCmd,
  token: token.slashCmd,
  profile: profile.slashCmd,
  deposit: deposit.slashCmd,
  sendxp: sendxp.slashCmd,
  tokenrole: tokenrole.slashCmd,
  xprole: xprole.slashCmd,
  mixrole: mixrole.slashCmd,
  alert: alert.slashCmd,
  wallet: wallet.slashCmd,
  stats: stats.slashCmd,
  gas: gas.slashCmd,
  game: game.slashCmd,
  activity: activity.slashCmd,
  inbox: inbox.slashCmd,
  convert: convert.slashCmd,
  vault: vault.slashCmd,
  config: config.slashCmd,
  heatmap: heatmap.slashCmd,
  swap: swap.slashCmd,
  tagme: tagme.slashCmd,
  trending: trending.slashCmd,
}

export const originalCommands: Record<string, Command> = {
  // general help
  help: help.textCmd,
  // profile section
  profile: profile.textCmd,
  // defi section
  deposit: deposit.textCmd,
  tip: tip.textCmd,
  claim: claim.textCmd,
  balances: balances.textCmd,
  withdraw: withdraw.textCmd,
  tokens: token.textCmd,
  ticker: ticker.textCmd,
  watchlist: watchlist.textCmd,
  statements: statements.textCmd,
  gm: gm.textCmd,
  nft: nft.textCmd,
  top: top.textCmd,
  sales: sales.textCmd,
  verify: verify.textCmd,
  feedback: feedback.textCmd,
  prune: prune.textCmd,
  quest: quest.textCmd,
  alert: alert.textCmd,
  gas: gas.textCmd,
  activity: activity.textCmd,
  inbox: inbox.textCmd,
  convert: convert.textCmd,
  // config section
  reactionrole: reactionrole.textCmd,
  defaultrole: defaultrole.textCmd,
  moniker: moniker.textCmd,
  levelrole: levelrole.textCmd,
  nftrole: nftrole.textCmd,
  proposal: proposal.textCmd,
  levelmessage: levelmessage.textCmd,
  tokenrole: tokenrole.textCmd,
  xprole: xprole.textCmd,
  mixrole: mixrole.textCmd,
  stats: stats.textCmd,
  // globalxp,
  starboard: starboard.textCmd,
  log: log.textCmd,
  poe: poe.textCmd,
  telegram: telegram.textCmd,
  sendxp: sendxp.textCmd,

  // wallet
  wallet: wallet.textCmd,

  //game
  game: game.textCmd,

  // pay
  pay: pay.textCmd,

  heatmap: heatmap.textCmd,
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
export async function preauthorizeCommand(
  message: Message,
  commandObject: Command
) {
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
      // send command tracking
      try {
        const kafkaMsg: KafkaQueueMessage = {
          platform: "discord",
          data: {
            command: "help",
            subcommand: commandObject.id,
            full_text_command: message.content,
            command_type: "$",
            channel_id: message.channelId,
            guild_id: message.guildId !== null ? message.guildId : "DM",
            author_id: message.author.id,
            execution_time_ms: Math.round(benchmarkStop[1] / 1000000),
            success: true,
            message: message,
          },
        }
        await kafkaQueue?.produceBatch([JSON.stringify(kafkaMsg)])
      } catch (error) {
        logger.error("[KafkaQueue] - failed to enqueue")
      }
    }
    return
  }

  // execute command in `commands`
  const runResponse = await commandObject.run(message, action)
  if (runResponse) {
    if ("messageOptions" in runResponse) {
      const msg = await message.reply({
        ...runResponse.messageOptions,
      })
      // partner ads
      if (getChance(4)) {
        await message.channel?.send({
          embeds: [composePartnerEmbedPimp()],
          components: [
            composeButtonLink(
              `Customize your ad with Mochi`,
              "https://discord.gg/SUuF8W68"
            ),
          ],
        })
      }
      if (runResponse.interactionOptions && msg) {
        InteractionManager.add(msg.id, runResponse.interactionOptions)
      }
      if (runResponse.buttonCollector) {
        const { handler, options = {} } = runResponse.buttonCollector
        msg
          .createMessageComponentCollector({
            componentType: MessageComponentTypes.BUTTON,
            idle: 60000,
            filter: authorFilter(message.author.id),
            ...options,
          })
          .on("collect", async (i: ButtonInteraction) => {
            const newRes = await handler(i)
            if (newRes) {
              const newMsg = await msg.edit({
                embeds: newRes.messageOptions.embeds,
                components: newRes.messageOptions.components,
              })
              if (newRes.interactionOptions) {
                InteractionManager.add(newMsg.id, newRes.interactionOptions)
              }
            }
          })
          .on("end", () => {
            msg.edit({ components: [] }).catch(() => null)
          })
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
  try {
    let command = commandObject.id
    let subcommand = ""
    if (commandObject.id.includes("_")) {
      ;[command, subcommand] = commandObject.id.split("_")
    }
    const kafkaMsg: KafkaQueueMessage = {
      platform: "discord",
      data: {
        command,
        subcommand,
        full_text_command: message.content,
        command_type: "$",
        channel_id: message.channelId,
        guild_id: message.guildId !== null ? message.guildId : "DM",
        author_id: message.author.id,
        execution_time_ms: Math.round(benchmarkStop[1] / 1000000),
        success: true,
        message: message,
      },
    }
    await kafkaQueue?.produceBatch([JSON.stringify(kafkaMsg)])
  } catch (error) {
    logger.error("[KafkaQueue] - failed to enqueue")
  }
}

export async function handlePrefixedCommand(message: Message) {
  const args = getCommandArguments(message)
  logger.info(
    `[${message.guild?.name ?? "DM"}][${
      message.author.username
    }] executing command: ${args}`
  )

  const metadata = getCommandMetadata(commands, message)
  const { commandKey, action = "" } = metadata
  let { isSpecificHelpCommand } = metadata

  if (!commandKey) return

  const commandObject = commands[commandKey]

  // send suggest embed if command not found
  if (!commandObject) {
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
  await Config.checkGuildCommandScopes(message, commandObject)

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
