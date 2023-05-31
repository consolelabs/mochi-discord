import CacheManager from "cache/node-cache"
import { slashCommands } from "commands"
import { handleInteraction } from "commands/balances/index/processor"
import { feedbackDispatcher } from "commands/feedback/index/processor"
import { handleGainerView } from "commands/gainer/index/processor"
import { confirmGlobalXP } from "commands/globalxp/index/processor"
import { handleLoserView } from "commands/loser/index/processor"
import { handleNFTTickerViews } from "commands/nft/ticker/processor"
import { handleDaoTrackerView } from "commands/proposal/info/processor"
import {
  handleProposalCancel,
  handleProposalCreate,
  handleProposalForm,
  handleProposalVote,
} from "commands/proposal/processor"
import { subscribeCommonwealthDiscussion } from "commands/proposal/track/processor"
import {
  handleBackToQuestList,
  handleClaimReward,
} from "commands/quest/daily/processor"
import { handleSwap } from "commands/swap/index/processor"
import { handleTickerViews } from "commands/ticker/index/processor"
import {
  handleTokenApprove,
  handleTokenReject,
} from "commands/token/add/processor"
import { handleTreasurerAdd } from "commands/vault/add/processor"
import { handleTreasurerTransfer } from "commands/vault/transfer/processor"
import { handleTreasurerRemove } from "commands/vault/remove/processor"
import { sendVerifyURL } from "commands/verify/processor"
import {
  addWallet,
  redirectToAddMoreWallet,
} from "commands/wallet/add/processor"
import {
  removeWallet,
  removeWalletConfirmation,
} from "commands/wallet/remove/processor"
import {
  handleWalletRenaming,
  navigateWalletViews,
  viewWallet,
} from "commands/wallet/view/processor"
import { addToWatchlist } from "commands/watchlist/add/processor"
import { viewTickerRouteSwap } from "commands/swap/index/processor"
import {
  AutocompleteInteraction,
  ButtonInteraction,
  CommandInteraction,
  Interaction,
  Message,
  SelectMenuInteraction,
} from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { EXPERIMENTAL_CATEGORY_CHANNEL_IDS } from "env"
import { CommandNotAllowedToRunError } from "errors"
import InteractionManager from "handlers/discord/select-menu"
import tagme from "handlers/tagme"
import { logger } from "logger"
import { kafkaQueue } from "queue/kafka/queue"
import { KafkaQueueMessage } from "types/common"
import { composeButtonLink, composeDiscordExitButton } from "ui/discord/button"
import {
  composePartnerEmbedPimp,
  getErrorEmbed,
  getMultipleResultEmbed,
} from "ui/discord/embed"
import {
  composeDiscordSelectionRow,
  setDefaultMiddleware,
} from "ui/discord/select-menu"
import { slashCommandAsyncStore } from "utils/async-storages"
import {
  authorFilter,
  getChance,
  getEmoji,
  hasAdministrator,
} from "utils/common"
import { wrapError } from "utils/wrap-error"
import { DiscordEvent } from "."
import config from "adapters/config"

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
          "GIFT"
        )}`
      case "ticker":
        return `> Run /ticker thrice a day to get more XP! ${getEmoji("GIFT")}`
    }
  }
  return undefined
}

const event: DiscordEvent<"interactionCreate"> = {
  name: "interactionCreate",
  once: false,
  execute: async (interaction) => {
    const id = interaction.isCommand()
      ? interaction.toString()
      : interaction.isSelectMenu() || interaction.isButton()
      ? interaction.customId
      : interaction.isAutocomplete()
      ? `autocomplete:${
          interaction.commandName
        }:${interaction.options.getSubcommand()}:${
          interaction.options.getFocused(true).name
        }`
      : ""
    if (!id) return
    if (
      !interaction.isSelectMenu() &&
      !interaction.isButton() &&
      !interaction.isCommand() &&
      !interaction.isAutocomplete()
    ) {
      return
    }
    slashCommandAsyncStore.run(
      {
        msgOrInteraction: interaction,
        data: JSON.stringify({
          sub_event_type: "interactionCreate",
          guild_id: interaction.guildId || "DM",
          channel_id: interaction.channelId,
          discord_id: interaction.user.id,
          command: id,
          interaction_id: interaction.id,
        }),
      },
      () => {
        wrapError(interaction, async () => {
          if (interaction.isSelectMenu()) {
            await handleSelectMenuInteraction(interaction)
          }
          if (interaction.isButton()) {
            await handleButtonInteraction(interaction)
          }
          if (interaction.isCommand()) {
            handleCommandInteraction(interaction)
          }
          if (interaction.isAutocomplete()) {
            handleAutocompleteInteraction(interaction)
          }
        })
      }
    )
  },
}

export default event

function handleAutocompleteInteraction(interaction: AutocompleteInteraction) {
  wrapError(interaction, () => {
    const command = slashCommands[interaction.commandName]
    command.autocomplete?.(interaction)
    return Promise.resolve()
  })
}

function handleCommandInteraction(interaction: Interaction) {
  wrapError(interaction, async () => {
    const benchmarkStart = process.hrtime()
    const i = interaction as CommandInteraction
    const command = slashCommands[i.commandName]
    if (!command) {
      await i.reply({
        embeds: [getErrorEmbed({ description: "Command not found" })],
      })
      return
    }
    let subcommand = ""
    let args = ""
    if (interaction.isCommand()) {
      subcommand = interaction.options.getSubcommand(false) || ""
      args = interaction.commandName + " " + subcommand
    }
    const gMember = interaction?.guild?.members.cache.get(interaction?.user.id)
    // if this command is experimental -> only allow it to run inside certain channels
    if (command.experimental) {
      const isTextChannel = interaction.channel?.type === "GUILD_TEXT"
      if (!isTextChannel) return
      const parentId = interaction.channel.parentId
      if (!parentId || !EXPERIMENTAL_CATEGORY_CHANNEL_IDS.includes(parentId))
        return
    }

    const { data } = await CacheManager.get({
      pool: "bot-manager",
      key: `guild-${interaction.guildId}`,
      call: () =>
        config.getGuildAdminRoles({ guildId: interaction.guildId ?? "" }),
    })

    let isAdminRoleIncluded = false
    const memberRoles = gMember?.roles.cache
    if (data && memberRoles) {
      const adminConfigRoles = data.map(
        (cfg: { role_id: number }) => cfg.role_id
      )

      for (const [, role] of memberRoles) {
        if (adminConfigRoles.includes(role.id)) {
          isAdminRoleIncluded = true
          break
        }
      }
    }

    const isAdmin = isAdminRoleIncluded || hasAdministrator(gMember)
    let commandOnlyAdmin = false
    if (typeof command.onlyAdministrator === "function") {
      commandOnlyAdmin = command.onlyAdministrator(i)
    } else {
      commandOnlyAdmin = command.onlyAdministrator ?? false
    }
    if (commandOnlyAdmin && !isAdmin) {
      await i.deferReply({ ephemeral: command?.ephemeral })
      try {
        const kafkaMsg: KafkaQueueMessage = {
          platform: "discord",
          data: {
            command: command.name,
            subcommand,
            full_text_command: "",
            command_type: "/",
            channel_id: interaction.channelId || "DM",
            guild_id: interaction.guildId || "DM",
            author_id: interaction.user.id,
            success: false,
            execution_time_ms: 0,
            interaction: interaction,
          },
        }
        await kafkaQueue?.produceBatch([JSON.stringify(kafkaMsg)])
      } catch (error) {
        logger.error("[KafkaQueue] - failed to enqueue")
      }
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
    const benchmarkStop = process.hrtime(benchmarkStart)
    // send command tracking to kafka
    try {
      const kafkaMsg: KafkaQueueMessage = {
        platform: "discord",
        data: {
          command: command.name,
          subcommand: subcommand,
          full_text_command: args,
          command_type: "/",
          channel_id: interaction.channelId || "DM",
          guild_id: interaction.guildId || "DM",
          author_id: interaction.user.id,
          success: true,
          execution_time_ms: Math.round(benchmarkStop[1] / 1000000),
          interaction: interaction,
        },
      }
      await kafkaQueue?.produceBatch([
        JSON.stringify(kafkaMsg, (_, v) =>
          typeof v === "bigint" ? v.toString() : v
        ),
      ])
    } catch (error) {
      logger.error("[KafkaQueue] - failed to enqueue")
    }
    if ("messageOptions" in response) {
      const { messageOptions, interactionOptions, buttonCollector } = response
      const msg = await i
        .editReply({
          content: await questReminder(i.user.id, i.commandName),
          ...messageOptions,
        })
        .catch(() => null)
      // partner ads
      if (getChance(4)) {
        await i.channel?.send({
          embeds: [composePartnerEmbedPimp()],
          components: [
            composeButtonLink(
              `Customize your ad with Mochi`,
              "https://discord.gg/SUuF8W68"
            ),
          ],
        })
      }
      if (interactionOptions && msg) {
        InteractionManager.add(msg.id, interactionOptions)
      }
      if (msg && buttonCollector) {
        const { handler, options = {} } = buttonCollector
        const message = <Message>msg
        message
          .createMessageComponentCollector({
            componentType: MessageComponentTypes.BUTTON,
            idle: 60000,
            filter: authorFilter(i.user.id),
            ...options,
          })
          .on("collect", async (i: ButtonInteraction) => {
            const newRes = await handler(i)
            if (newRes) {
              await message.edit({
                embeds: newRes.messageOptions.embeds,
                components: newRes.messageOptions.components,
              })
            }
          })
          .on("end", () => {
            message.edit({ components: [] }).catch(() => null)
          })
      }
    } else if ("select" in response) {
      // ask default case
      const {
        ambiguousResultText,
        multipleResultText,
        select,
        onDefaultSet,
        render,
        title,
        description,
      } = response
      const multipleEmbed = getMultipleResultEmbed({
        title,
        description,
        ambiguousResultText,
        multipleResultText,
      })
      const selectRow = composeDiscordSelectionRow({
        customId: `mutliple-results-${i.id}`,
        ...select,
      })
      const msg = await i.editReply({
        embeds: [multipleEmbed],
        components: [selectRow],
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
    const deferredOrReplied = i.deferred || i.replied
    const msg = await (deferredOrReplied
      ? i.editReply(replyMessage)
      : i.reply(replyMessage))
    if (msg && msg instanceof Message && buttonCollector) {
      const { handler, options = {} } = buttonCollector
      msg
        .createMessageComponentCollector({
          time: 300000,
          componentType: MessageComponentTypes.BUTTON,
          filter: authorFilter(i.user.id),
          ...options,
        })
        .on("collect", async (i) => {
          const newRes = await handler(i)
          if (newRes) {
            await msg.edit({
              embeds: newRes.messageOptions.embeds,
              components: newRes.messageOptions.components,
            })
          }
        })
        .on("end", () => {
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
    case i.customId.startsWith("mochi_verify"):
      await sendVerifyURL(i)
      return
    case i.customId.startsWith("globalxp"):
      await confirmGlobalXP(i, msg)
      return
    case i.customId.startsWith("ticker_view_"):
      await handleTickerViews(i)
      return
    case i.customId.startsWith("ticker_add_wl"):
      await addToWatchlist(i)
      return
    case i.customId.startsWith("ticker_route_swap"):
      await viewTickerRouteSwap(i)
      return
    case i.customId.startsWith("nft_ticker_view"):
      await handleNFTTickerViews(i)
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
    case i.customId.startsWith("create-proposal"):
      await handleProposalForm(i)
      return
    case i.customId.startsWith("proposal-confirm"):
      await handleProposalCreate(i)
      return
    case i.customId.startsWith("proposal-cancel"):
      await handleProposalCancel(i)
      return
    case i.customId.startsWith("proposal-vote"):
      await handleProposalVote(i)
      return
    case i.customId.startsWith("proposal-info"):
      await handleDaoTrackerView(i)
      return
    case i.customId.startsWith("wallet_view_details-"):
      await viewWallet(i)
      return
    case i.customId.startsWith("wl_my_"):
      await navigateWalletViews(i)
      return
    case i.customId.startsWith("wallet_rename-"):
      await handleWalletRenaming(i)
      return
    case i.customId.startsWith("wallet_remove_confirmation-"):
      await removeWalletConfirmation(i)
      return
    case i.customId.startsWith("wallet_remove-"):
      await removeWallet(i)
      return
    case i.customId.startsWith("wallet_add_more-"):
      await redirectToAddMoreWallet(i)
      return
    case i.customId.startsWith("wallet_add-"):
      await addWallet(i)
      return
    case i.customId.startsWith("proposal_join_thread_commonwealth"):
      await subscribeCommonwealthDiscussion(i)
      return
    case i.customId.startsWith("token-request-approve"):
      await handleTokenApprove(i)
      return
    case i.customId.startsWith("token-request-reject"):
      await handleTokenReject(i)
      return
    case i.customId.startsWith("treasurerAdd-approved"):
      await handleTreasurerAdd(i)
      return
    case i.customId.startsWith("treasurerAdd-rejected"):
      await handleTreasurerAdd(i)
      return
    case i.customId.startsWith("treasurerRemove-approved"):
      await handleTreasurerRemove(i)
      return
    case i.customId.startsWith("treasurerRemove-rejected"):
      await handleTreasurerRemove(i)
      return
    case i.customId.startsWith("treaTransfer-approved"):
      await handleTreasurerTransfer(i)
      return
    case i.customId.startsWith("treaTransfer-rejected"):
      await handleTreasurerTransfer(i)
      return
    case i.customId.startsWith("tagme"):
      await tagme.editSubscribeStatus(i)
      return
    case i.customId.startsWith("swap-mochi-wallet"):
      await handleSwap(i)
      return
    case i.customId.startsWith("balance"):
      await handleInteraction(i)
      return
    case i.customId.startsWith("gainer-view"):
      await handleGainerView(i)
      return
    case i.customId.startsWith("loser-view"):
      await handleLoserView(i)
      return
    default: {
      return
    }
  }
}
