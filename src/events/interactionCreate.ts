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
import { getErrorEmbed } from "utils/discordEmbed"
import CacheManager from "utils/CacheManager"
import community from "adapters/community"
import { wrapError } from "utils/wrapError"
import { handleTickerViews } from "commands/defi/ticker"
import { handleNFTTickerViews } from "commands/community/nft/ticker"
import { hasAdministrator } from "utils/common"
import { handleButtonOffer } from "commands/community/trade"
import InteractionManager from "utils/InteractionManager"

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
  const gMember = interaction?.guild?.members.cache.get(interaction?.user.id)
  if (command.onlyAdministrator && !hasAdministrator(gMember)) {
    await i.reply({
      embeds: [
        getErrorEmbed({
          title: "Insufficient permissions",
          description:
            "Only Administrators of this server can run this command.",
        }),
      ],
    })
    return
  }
  await i.deferReply({ ephemeral: command?.ephemeral })
  const response = await command.run(i)
  if (!response) return
  const { messageOptions, interactionOptions } = response
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
  const msg = await i
    .editReply({
      ...(shouldRemind
        ? { content: "> 👋 Psst! You can vote now, try `$vote`. 😉" }
        : {}),
      ...messageOptions,
    })
    .catch(() => null)
  if (interactionOptions && msg) {
    InteractionManager.add(msg.id, interactionOptions)
  }
}

async function handleSelecMenuInteraction(i: SelectMenuInteraction) {
  await i.deferUpdate().catch(() => null)
  const msg = i.message as Message
  const oldInteractionOptions = await InteractionManager.get(msg.id)
  if (!oldInteractionOptions?.handler) return

  const { messageOptions, interactionOptions, replyMessage } =
    await oldInteractionOptions.handler(i)

  if (replyMessage) {
    // already deferred or replied in commandChoice.handler()
    // we do this for long-response command (> 3s) to prevent bot from throwing "Unknown interaction" error
    await i.editReply(replyMessage).catch(() => null)
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
    case i.customId.startsWith("trade-offer"):
      await handleButtonOffer(i)
      return
    default:
      return
  }
}
