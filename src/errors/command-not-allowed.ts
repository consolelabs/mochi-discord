import { getEmoji } from "utils/common"
import { DISCORD_URL } from "utils/constants"
import { BotBaseError, OriginalMessage } from "./base"
import { getErrorEmbed } from "ui/discord/embed"
import { composeButtonLink } from "ui/discord/button"

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
        )}. Please contact your server admins if you need help.`,
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
      components: [composeButtonLink("Support", DISCORD_URL, getEmoji("defi"))],
    }
    this.reply?.(msgOptions)
  }
}
