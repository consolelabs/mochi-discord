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
import { MessageComponentTypes } from "discord.js/typings/enums"
import CommandChoiceManager from "utils/CommandChoiceManager"
import { DiscordEvent } from "."
import { getErrorEmbed } from "utils/discordEmbed"
import CacheManager from "utils/CacheManager"
import community from "adapters/community"
import { wrapError } from "utils/wrapError"
import { handleTickerViews } from "commands/defi/ticker"
import { handleNFTTickerViews } from "commands/community/nft/ticker"

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
        await handleSelecMenuInteraction(interaction)
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
  const i = interaction as CommandInteraction
  const command = slashCommands[i.commandName]
  if (!command) {
    await i.reply({ embeds: [getErrorEmbed({})] })
    return
  }
  await i.deferReply({ ephemeral: command?.ephemeral })
  const response = await command.run(i)
  if (!response) return
  const { messageOptions, commandChoiceOptions } = response
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
  const reply = <Message>await i
    .editReply({
      ...(shouldRemind
        ? { content: "> 👋 Psst! You can vote now, try `$vote`. 😉" }
        : {}),
      ...messageOptions,
    })
    .catch(() => null)
  if (commandChoiceOptions) {
    CommandChoiceManager.add({
      ...commandChoiceOptions,
      messageId: reply.id,
    })
  }
}

async function handleSelecMenuInteraction(interaction: Interaction) {
  const i = interaction as SelectMenuInteraction
  const msg = i.message as Message
  const key = `${i.user.id}_${msg.guildId}_${msg.channelId}`
  const commandChoice = await CommandChoiceManager.get(key)
  if (!commandChoice || !commandChoice.handler) return
  if (i.customId === "exit") {
    await msg
      .delete()
      .catch(() => {
        commandChoice.interaction?.editReply({
          content: "Exited!",
          components: [],
          embeds: [],
        })
      })
      .catch(() => null)
    CommandChoiceManager.remove(key)
    return
  }

  const { messageOptions, commandChoiceOptions, ephemeralMessage } =
    await commandChoice.handler(i)

  let output: Message
  const deferredOrReplied = i.deferred || i.replied
  if (ephemeralMessage && deferredOrReplied) {
    // already deferred or replied in commandChoice.handler()
    // we do this for long-response command (> 3s) to prevent bot from throwing "Unknown interaction" error
    output = <Message>await i
      .editReply({
        embeds: ephemeralMessage.embeds,
        components: ephemeralMessage.components,
      })
      .catch(() => null)
  } else if (ephemeralMessage && !deferredOrReplied) {
    output = <Message>await i.reply({
      ephemeral: true,
      fetchReply: true,
      embeds: ephemeralMessage.embeds,
      components: ephemeralMessage.components,
    })
  } else if (!ephemeralMessage && !deferredOrReplied) {
    // no ephemeral so no need to respond to interaction
    output = <Message>await i.deferUpdate({ fetchReply: true })
  } else {
    output = <Message>i.message
  }

  if (ephemeralMessage?.buttonCollector) {
    output
      .createMessageComponentCollector({
        componentType: MessageComponentTypes.BUTTON,
      })
      .on("collect", async (i) => {
        await i.deferUpdate()
        const result = await ephemeralMessage.buttonCollector?.(i)
        if (!result) return
        i.editReply({
          embeds: result.embeds,
          components: result.components ?? [],
        }).catch(() => null)
      })
  }

  await CommandChoiceManager.update(key, {
    ...commandChoiceOptions,
    interaction: i,
    messageId: output?.id,
  })
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
    case i.customId.startsWith("confirm_airdrop-"):
      await confirmAirdrop(i, msg)
      return
    case i.customId.startsWith("enter_airdrop-"):
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
    case i.customId.startsWith("nft_ticker_view"):
      await handleNFTTickerViews(i)
      return
    default:
      return
  }
}
