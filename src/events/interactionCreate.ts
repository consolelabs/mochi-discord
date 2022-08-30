import { confirmGlobalXP } from "commands/config/globalxp"
import { confirmAirdrop, enterAirdrop } from "commands/defi/airdrop"
import { backToTickerSelection } from "commands/defi/ticker"
import { triplePodInteraction } from "commands/games/tripod"
import { sendVerifyURL } from "commands/profile/verify"
import { SelectMenuInteraction, ButtonInteraction, Message } from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { BotBaseError } from "errors"
import { logger } from "logger"
import ChannelLogger from "utils/ChannelLogger"
import CommandChoiceManager from "utils/CommandChoiceManager"
import { Event } from "."

export default {
  name: "interactionCreate",
  once: false,
  execute: async (interaction: SelectMenuInteraction | ButtonInteraction) => {
    try {
      const msg = interaction.message as Message
      if (interaction.isSelectMenu()) {
        await handleSelecMenuInteraction(
          interaction as SelectMenuInteraction,
          msg
        )
        return
      }

      await handleButtonInteraction(interaction as ButtonInteraction, msg)
    } catch (e) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e as string)
      }
      ChannelLogger.log(error, 'Event<"interactionCreate">')
    }
  },
} as Event<"interactionCreate">

async function handleSelecMenuInteraction(
  interaction: SelectMenuInteraction,
  msg: Message
) {
  const key = `${interaction.user.id}_${msg.guildId}_${msg.channelId}`
  const commandChoice = await CommandChoiceManager.get(key)
  if (!commandChoice || !commandChoice.handler) return
  if (interaction.customId === "exit") {
    await msg.delete().catch(() => {
      commandChoice.interaction?.editReply({
        content: "Exited!",
        components: [],
        embeds: [],
      })
    })
    CommandChoiceManager.remove(key)
    return
  }

  const { messageOptions, commandChoiceOptions, ephemeralMessage } =
    await commandChoice.handler(interaction)

  if (interaction) {
    let output: Message
    if (ephemeralMessage) {
      output = (await interaction.reply({
        fetchReply: true,
        ephemeral: true,
        embeds: ephemeralMessage.embeds,
        components: ephemeralMessage.components,
      })) as Message
      if (ephemeralMessage.buttonCollector) {
        output
          .createMessageComponentCollector({
            componentType: MessageComponentTypes.BUTTON,
            idle: 60000,
          })
          .on("collect", async (i) => {
            await i.deferUpdate()
            const result = await ephemeralMessage.buttonCollector?.(i)
            if (!result) return
            interaction.editReply({
              embeds: result.embeds,
              components: result.components ?? [],
            })
          })
      }
    } else {
      output = (await interaction.deferUpdate({ fetchReply: true })) as Message
    }
    await CommandChoiceManager.update(key, {
      ...commandChoiceOptions,
      interaction,
      messageId: output.id,
    })
  }
  await msg.edit(messageOptions)
}

async function handleButtonInteraction(
  interaction: ButtonInteraction,
  msg: Message
) {
  const buttonInteraction = interaction as ButtonInteraction
  switch (true) {
    case interaction.customId.startsWith("exit-"): {
      const authorId = interaction.customId.split("-")[1]
      if (interaction.user.id !== authorId) {
        await interaction.deferUpdate()
        return
      }
      await msg.delete()
      return
    }
    case interaction.customId.startsWith("confirm_airdrop-"):
      await confirmAirdrop(buttonInteraction, msg)
      return
    case interaction.customId.startsWith("enter_airdrop-"):
      await enterAirdrop(buttonInteraction, msg)
      return
    case interaction.customId.startsWith("mochi_verify"):
      await sendVerifyURL(buttonInteraction)
      return
    case interaction.customId.startsWith("globalxp"):
      await confirmGlobalXP(buttonInteraction, msg)
      return
    case interaction.customId.startsWith("triple-pod-"):
      await triplePodInteraction(interaction)
      return
    case interaction.customId.startsWith("ticker_selection-"):
      await backToTickerSelection(interaction, msg)
      return
    default:
      return
  }
}
