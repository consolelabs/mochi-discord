import { confirmGlobalXP } from "commands/config/globalxp"
import { confirmAirdrop, enterAirdrop } from "commands/defi/airdrop"
import { sendVerifyURL } from "commands/profile/verify"
import { SelectMenuInteraction, ButtonInteraction, Message } from "discord.js"
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
  if (!commandChoice) return
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

  const { messageOptions, commandChoiceOptions } = await commandChoice.handler(
    interaction
  )

  if (interaction) {
    const output = await interaction.deferUpdate({ fetchReply: true })
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
    default:
      return
  }
}
