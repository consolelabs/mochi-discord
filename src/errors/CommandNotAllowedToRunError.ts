import { CommandInteraction, Message, TextChannel, User } from "discord.js"
import { getEmoji } from "utils/common"
import { PERMANENT_MOCHI_INVITE_URL } from "utils/constants"
import { composeButtonLink, getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError } from "./BaseError"

export class CommandNotAllowedToRunError extends BotBaseError {
  private discordMessage: Message | undefined
  private interaction: CommandInteraction | undefined
  private missingPermissions: string[]
  private author: User | undefined

  constructor({
    message,
    interaction,
    command,
    missingPermissions = [],
  }: {
    message?: Message
    interaction?: CommandInteraction
    command: string
    missingPermissions?: string[]
  }) {
    super()
    this.name = "Command not allowed to run"
    this.discordMessage = message
    this.interaction = interaction
    this.missingPermissions = missingPermissions
    this.author = message?.author ?? interaction?.user
    const channel = (message ?? interaction)?.channel as TextChannel
    this.message = JSON.stringify({
      guild: (message ?? interaction)?.guild?.name,
      channel: channel.name,
      user: this.author?.tag,
      data: { command },
    })
  }

  handle() {
    let errorEmbed
    if (this.missingPermissions?.length) {
      errorEmbed = getErrorEmbed({
        title: `Permissions required`,
        description: `Only Administrators can use this command ${getEmoji(
          "nekosad"
        )}.`,
      })
    } else {
      errorEmbed = getErrorEmbed({
        description: `This command is not allowed to run in DM ${getEmoji(
          "nekosad"
        )}.`,
      })
    }
    const msgOptions = {
      embeds: [errorEmbed],
      components: [
        composeButtonLink(
          "Support",
          PERMANENT_MOCHI_INVITE_URL,
          getEmoji("defi")
        ),
      ],
    }
    if (this.discordMessage) {
      this.discordMessage.reply(msgOptions)
      return
    }
    this.interaction?.reply(msgOptions)
  }
}
