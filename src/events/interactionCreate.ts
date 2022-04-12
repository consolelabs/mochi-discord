import { confirmAirdrop, enterAirdrop } from "commands/airdrop"
import { changePage } from "commands/portfolio"
import { changeXpPage } from "commands/xp"
import {
  SelectMenuInteraction,
  ButtonInteraction,
  Message,
  CommandInteraction,
} from "discord.js"
import { NekoBotBaseError } from "errors"
import { logger } from "logger"
import ChannelLogger from "utils/ChannelLogger"
import CommandChoiceManager from "utils/CommandChoiceManager"
import { getLoadingEmbed } from "utils/discord"
import { Event } from "."
import profile from "../modules/profile"
import alpha from "../slashCommands/alpha"

export default {
  name: "interactionCreate",
  once: false,
  execute: async (
    interaction: SelectMenuInteraction | ButtonInteraction | CommandInteraction
  ) => {
    if (interaction instanceof CommandInteraction && interaction.isCommand()) {
      switch (interaction.commandName) {
        case "alpha":
          await alpha.execute(interaction)
      }
      return
    }

    try {
      const msg = interaction.message as Message
      const key = `${interaction.user.id}_${msg.guildId}_${msg.channelId}`
      const commandChoice = await CommandChoiceManager.get(key)
      if (commandChoice) {
        if (interaction.customId === "exit") {
          await msg.delete().catch(() => {
            commandChoice.interaction
              ?.editReply({ content: "Exited!", components: [], embeds: [] })
              .catch(() => {})
          })
          CommandChoiceManager.remove(key)
        } else {
          await msg.delete().catch(() => {})
          if (commandChoice.interaction) {
            await interaction.deferReply()
          } else {
            // TODO: refactor this
            await interaction.reply({
              ephemeral: interaction.customId !== "ticker_view_option",
              embeds: [
                await getLoadingEmbed({
                  channel: interaction.channel,
                  author: interaction.user,
                } as Message),
              ],
            })
          }
          const { messageOptions, commandChoiceOptions } =
            await commandChoice.handler(interaction)

          const output = await interaction.editReply({
            ...messageOptions,
          })
          await CommandChoiceManager.update(key, {
            ...commandChoiceOptions,
            interaction,
            messageId: output.id,
          })
        }
      } else {
        switch (true) {
          case interaction.isButton(): {
            const buttonInteraction = interaction as ButtonInteraction
            switch (true) {
              case interaction.customId.startsWith("portfolio_page"):
                changePage(buttonInteraction)
                return
              case interaction.customId.startsWith("verify"):
                profile.sendVerifyURL(buttonInteraction)
                return
              case interaction.customId.startsWith("xp_page_"):
                changeXpPage(buttonInteraction)
                return
              case interaction.customId === "cancel_airdrop":
                await msg.delete().catch(() => {})
                return
              case interaction.customId.startsWith("confirm_airdrop-"):
                await confirmAirdrop(buttonInteraction, msg)
                return

              case interaction.customId.startsWith("enter_airdrop-"):
                await enterAirdrop(buttonInteraction, msg)
                return
            }
          }
        }
      }
    } catch (e: any) {
      const error = e as NekoBotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e)
      }
      ChannelLogger.log(error)
    }
  },
} as Event<"interactionCreate">

function isOriginalAuthor(
  interaction: SelectMenuInteraction | ButtonInteraction
) {
  const authorId = interaction.customId.split("-")[1]
  if (authorId !== interaction.user.id) {
    interaction.deferUpdate()
  }
  return authorId === interaction.user.id
}
