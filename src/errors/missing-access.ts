import { getEmoji, getEmojiURL, msgColors } from "utils/common"
import { DOT } from "utils/constants"
import { BotBaseError, OriginalMessage } from "./base"
import { getErrorEmbed } from "ui/discord/embed"

export class MissingAccessError extends BotBaseError {
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
    this.name = "Missing access to run"
    this.missingPermissions = missingPermissions
    this.message = JSON.stringify({
      guild: this.guild,
      channel: this.channel,
      user: this.user,
      data: { command },
    })
  }

  handle() {
    if (!this.missingPermissions.length) {
      const errorEmbed = getErrorEmbed({
        description: `This command is not allowed to run, please make sure you have grant Tono enough permissions.\nIf not sure, just assign bot with the admin permission.`,
      })
      const msgOptions = {
        embeds: [errorEmbed],
      }
      this.reply?.(msgOptions)
    }

    const errorEmbed = getErrorEmbed({
      emojiUrl: getEmojiURL("675026602479976488"),
      title: "Holdup!",
      description: `:warning: This command cannot be run. Please grant Tono these permissions :warning:\n${this.missingPermissions
        .map((p) => `**${DOT} ${p.replace("_", " ")}**`)
        .join("\n")}`,
      color: msgColors.YELLOW,
    })
    const msgOptions = {
      embeds: [errorEmbed],
    }
    this.reply?.(msgOptions)
  }
}
