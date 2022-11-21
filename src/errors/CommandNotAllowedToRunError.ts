import { getEmoji } from "utils/common"
import { PERMANENT_MOCHI_INVITE_URL } from "utils/constants"
import { composeButtonLink, getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError, OriginalMessage } from "./BaseError"

export class CommandNotAllowedToRunError extends BotBaseError {
  private missingPermissions: string[]

  constructor({
    message,
    command,
    missingPermissions = [],
  }: {
    message: OriginalMessage
    command: string
    missingPermissions?: string[]
  }) {
    super(message)
    this.name = "Command not allowed to run"
    this.missingPermissions = missingPermissions
    this.message = JSON.stringify({
      guild: this.guild,
      channel: this.channel,
      user: this.user,
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
    this.reply?.(msgOptions)
  }
}
