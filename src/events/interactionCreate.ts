import { slashCommands } from "commands"
import { confirmGlobalXP } from "commands/config/globalxp"
import { confirmAirdrop, enterAirdrop } from "commands/defi/airdrop"
import { triplePodInteraction } from "commands/games/tripod"
import { sendVerifyURL } from "commands/profile/verify"
import {
  SelectMenuInteraction,
  ButtonInteraction,
  Message,
  Interaction,
  CommandInteraction,
} from "discord.js"
import { DiscordEvent } from "."
import {
  composeDiscordExitButton,
  composeDiscordSelectionRow,
  composeEmbedMessage,
  getErrorEmbed,
  getMultipleResultEmbed,
  setDefaultMiddleware,
} from "utils/discordEmbed"
import CacheManager from "utils/CacheManager"
import community from "adapters/community"
import { wrapError } from "utils/wrapError"
import { handleTickerViews } from "commands/defi/ticker/ticker"
import { handleNFTTickerViews } from "commands/community/nft/ticker"
import { authorFilter, getEmoji, hasAdministrator } from "utils/common"
import { handleButtonOffer, handleCreateSwap } from "commands/community/swap"
import InteractionManager from "utils/InteractionManager"
import { MessageComponentTypes } from "discord.js/typings/enums"
import {
  handleBackToQuestList,
  handleClaimReward,
} from "commands/community/quest/daily"
import ConversationManager from "utils/ConversationManager"
import { addToWatchlist } from "commands/defi/watchlist/add"
import { feedbackDispatcher } from "commands/community/feedback"
import { CommandNotAllowedToRunError } from "errors"

CacheManager.init({ pool: "quest", ttl: 0, checkperiod: 3600 })

async function questReminder(userId: string, command: string) {
  let isReminded = true
  await CacheManager.get({
    pool: "quest",
    key: `remind-quest-${userId}-${command}`,
    // 24h
    ttl: 86400,
    call: async () => {
      isReminded = false
      return true
    },
    callIfCached: async () => {
      isReminded = true
    },
  })
  if (!isReminded) {
    switch (command) {
      case "watchlist":
        return `> Check your watchlist thrice a day to get more XP! ${getEmoji(
          "CLAIM"
        )}`
      case "ticker":
        return `> Run /ticker thrice a day to get more XP! ${getEmoji("CLAIM")}`
    }
  }
  return undefined
}

const event: DiscordEvent<"interactionCreate"> = {
  name: "interactionCreate",
  once: false,
  execute: async (interaction) => {
    wrapError(interaction, async () => {
      if (
        !interaction.isSelectMenu() &&
        !interaction.isButton() &&
        !interaction.isCommand()
      )
        return
      if (interaction.isSelectMenu()) {
        await handleSelectMenuInteraction(interaction)
      } else if (interaction.isButton()) {
        await handleButtonInteraction(interaction)
      } else if (interaction.isCommand()) {
        await handleCommandInteraction(interaction)
      }
    })
  },
}

export default event

async function handleCommandInteraction(interaction: Interaction) {
  wrapError(interaction, async () => {
    const i = interaction as CommandInteraction
    const command = slashCommands[i.commandName]
    if (!command) {
      await i.reply({ embeds: [getErrorEmbed({})] })
      return
    }
    const gMember = interaction?.guild?.members.cache.get(interaction?.user.id)
    if (command.onlyAdministrator && !hasAdministrator(gMember)) {
      throw new CommandNotAllowedToRunError({
        message: i,
        command: i.commandName,
        missingPermissions:
          i.channel?.type === "DM" ? undefined : ["Administrator"],
      })
    }
    await i.deferReply({ ephemeral: command?.ephemeral })
    const response = await command.run(i)
    if (!response) return
    let shouldRemind = await CacheManager.get({
      pool: "vote",
      key: `remind-${i.user.id}-vote-again`,
      // 5 min
      ttl: 300,
      call: async () => {
        const res = await community.getUpvoteStreak(i.user.id)
        let ttl = 0
        let shouldRemind = true
        if (res.ok) {
          const timeUntilTopgg = res.data?.minutes_until_reset_topgg ?? 0
          const timeUntilDiscordBotList =
            res.data?.minutes_until_reset_discordbotlist ?? 0
          ttl = Math.max(timeUntilTopgg, timeUntilDiscordBotList)

          // only remind if both timers are 0 meaning both source can be voted again
          shouldRemind = ttl === 0
        }
        return shouldRemind
      },
    })
    if (i.commandName === "vote") {
      // user is already using $vote, no point in reminding
      shouldRemind = false
    }
    if ("messageOptions" in response) {
      const reminderEmbed = composeEmbedMessage(null, {
        title: "Vote for Mochi!",
        description: `Vote for Mochi to gain rewards. Run \`$vote\` now! ${getEmoji(
          "CLAIM"
        )}`,
      })
      const { messageOptions, interactionOptions } = response
      if (shouldRemind && Math.random() < 0.1) {
        messageOptions.embeds?.push(reminderEmbed)
      }
      const msg = await i
        .editReply({
          content: await questReminder(i.user.id, i.commandName),
          ...messageOptions,
        })
        .catch(() => null)
      if (interactionOptions && msg) {
        InteractionManager.add(msg.id, interactionOptions)
      }
    } else if ("select" in response) {
      // ask default case
      const {
        ambiguousResultText,
        multipleResultText,
        select,
        onDefaultSet,
        render,
      } = response
      const multipleEmbed = getMultipleResultEmbed({
        msg: null,
        ambiguousResultText,
        multipleResultText,
      })
      const selectRow = composeDiscordSelectionRow({
        customId: `mutliple-results-${i.id}`,
        ...select,
      })
      const msg = await i.reply({
        fetchReply: true,
        embeds: [multipleEmbed],
        components: [selectRow, composeDiscordExitButton(i.user.id)],
      })

      if (onDefaultSet && render) {
        InteractionManager.add(msg.id, {
          handler: setDefaultMiddleware<CommandInteraction>({
            onDefaultSet,
            label: ambiguousResultText,
            render,
            commandInteraction: i,
          }),
        })
      }
    }
  })
}

async function handleSelectMenuInteraction(i: SelectMenuInteraction) {
  const msg = i.message as Message
  const oldInteractionOptions = await InteractionManager.get(msg.id)
  if (!oldInteractionOptions?.handler) return

  const { messageOptions, interactionOptions, replyMessage, buttonCollector } =
    await oldInteractionOptions.handler(i)

  if (replyMessage) {
    const msg = await i.editReply(replyMessage)
    if (msg && msg instanceof Message && buttonCollector) {
      const collector = msg.createMessageComponentCollector({
        time: 300000,
        componentType: MessageComponentTypes.BUTTON,
        filter: authorFilter(i.user.id),
      })

      collector.on("collect", buttonCollector).on("end", () => {
        msg.edit({ components: [] }).catch(() => null)
      })
    }
  } else if (!i.deferred) {
    await i.deferUpdate().catch(() => null)
  }

  if (interactionOptions) {
    await InteractionManager.update(msg.id, interactionOptions)
  }
  await msg.edit(messageOptions).catch(() => null)
}

async function handleButtonInteraction(interaction: Interaction) {
  const i = interaction as ButtonInteraction
  const msg = i.message as Message
  switch (true) {
    case i.customId.startsWith("exit-"): {
      const authorId = i.customId.split("-")[1]
      if (i.user.id !== authorId) {
        await i.deferUpdate()
        return
      }
      await msg.delete()
      return
    }
    case i.customId.startsWith("confirm_airdrop"):
      await confirmAirdrop(i, msg)
      return
    case i.customId.startsWith("enter_airdrop"):
      await enterAirdrop(i, msg)
      return
    case i.customId.startsWith("mochi_verify"):
      await sendVerifyURL(i)
      return
    case i.customId.startsWith("globalxp"):
      await confirmGlobalXP(i, msg)
      return
    case i.customId.startsWith("triple-pod-"):
      await triplePodInteraction(i)
      return
    case i.customId.startsWith("ticker_view_"):
      await handleTickerViews(i)
      return
    case i.customId.startsWith("ticker_add_wl"):
      await addToWatchlist(i)
      return
    case i.customId.startsWith("nft_ticker_view"):
      await handleNFTTickerViews(i)
      return
    case i.customId.startsWith("create-trade"):
      await handleCreateSwap(i)
      break
    case i.customId.startsWith("trade-offer"):
      await handleButtonOffer(i)
      return
    case i.customId.startsWith("claim-rewards"):
      await handleClaimReward(i)
      return
    case i.customId.startsWith("back-to-quest-list"):
      await handleBackToQuestList(i)
      return
    case i.customId.startsWith("feedback"):
      await feedbackDispatcher(i)
      return
    default: {
      if (ConversationManager.hasConversation(i.user.id, i.channelId, i)) {
        ConversationManager.continueConversation(i.user.id, i.channelId, i)
      }
      return
    }
  }
}
