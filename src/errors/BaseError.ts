import {
  CommandInteraction,
  Message,
  MessageComponentInteraction,
  TextChannel,
} from "discord.js"
import { logger } from "logger"
import { getEmoji } from "utils/common"

export type OriginalMessage =
  | Message
  | MessageComponentInteraction
  | CommandInteraction

type ReplyFunc = (otps: any) => Promise<void>

// Base or "catch-all" error, do not throw this directly
export class BotBaseError extends Error {
  protected msgOrInteraction?: OriginalMessage
  protected reply?: ReplyFunc
  protected user = "Unknown"
  protected userId = ""
  protected channel = "DM"
  protected guild = "DM"

  constructor(message?: OriginalMessage, errorMessage?: string) {
    super()
    this.name = "Something went wrong (unexpected error)"
    if (message) {
      this.reply = (message.reply as ReplyFunc).bind(message)
      this.msgOrInteraction = message
      this.channel = (message.channel as TextChannel)?.name ?? "DM"
      this.guild = message.guild?.name ?? "DM"
      this.user = "author" in message ? message.author?.tag : message.user?.tag
      this.userId = "author" in message ? message.author?.id : message.user?.id
      this.message = JSON.stringify({
        guild: this.guild,
        channel: this.channel,
        user: this.user,
        message: errorMessage ?? "",
      })
    }
  }

  handle() {
    logger.error({
      name: this.name,
      message: this.message,
    })
    this.reply?.({
      embeds: [
        {
          author: {
            name: "Error",
            iconURL:
              "https://cdn.discordapp.com/emojis/967285238055174195.png?size=240&quality=lossless",
          },
          description: `Our team is fixing the issue. Stay tuned ${getEmoji(
            "nekosad"
          )}.`,
          color: "#D94F50",
        },
      ],
    }).catch(() => null)
  }
}
