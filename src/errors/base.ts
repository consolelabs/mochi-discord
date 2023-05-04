import {
  CommandInteraction,
  Message,
  MessageComponentInteraction,
} from "discord.js"
import { logger } from "logger"
import { kafkaQueue } from "queue/kafka/queue"
import { getEmoji, msgColors } from "utils/common"
import { stack } from "utils/stack-trace"

export type OriginalMessage =
  | Message
  | MessageComponentInteraction
  | CommandInteraction

type ReplyFunc = (otps: any) => Promise<void>

// Base or "catch-all" error, do not throw this directly
export class BotBaseError extends Error {
  protected msgOrInteraction?: OriginalMessage
  protected reply: ReplyFunc = () => {
    return Promise.resolve()
  }
  protected user = "Unknown"
  protected userId = ""
  protected channel = "DM"
  protected guild = "DM"

  constructor(message?: OriginalMessage, errorMessage?: string) {
    super()
    this.name = "Something went wrong (unexpected error)"
    let command = ""
    if (message) {
      const reply = (message.reply as ReplyFunc).bind(message)
      this.reply = async (...args) => {
        if (message instanceof Message) {
          command = message.content
          reply(...args).catch(() => null)
        } else {
          if (message.isCommand()) {
            command = message.toString()
          } else {
            const msg = message.message as Message
            const originalMsg = await msg.fetchReference()
            command = originalMsg.content
            const replyMsg = await message.editReply(...args).catch(() => null)
            if (!replyMsg) {
              reply(...args).catch(() => null)
            }
          }
        }
      }

      this.msgOrInteraction = message

      // this.channel = (message.channel as TextChannel)?.name ?? "DM"
      // this.guild = message.guild?.name ?? "DM"
      this.user = "author" in message ? message.author?.tag : message.user?.tag
      this.userId = "author" in message ? message.author?.id : message.user?.id
      this.message = JSON.stringify({
        guild_id: this.guild,
        channel_id: this.channel,
        user: this.user,
        message: errorMessage ?? "",
        command,
      })
    } else if (errorMessage) {
      this.message = JSON.stringify({
        log: errorMessage,
        stack: stack.clean(this.stack ?? ""),
      })
    }
  }

  handle() {
    const error = {
      name: this.name,
      message: this.message,
    }
    logger.error(error)
    kafkaQueue?.produceAnalyticMsg([JSON.parse(this.message)]).catch(() => null)
    this.reply({
      embeds: [
        {
          author: {
            name: "Error",
            iconURL:
              "https://cdn.discordapp.com/emojis/967285238055174195.png?size=240&quality=lossless",
          },
          description: `Our team is fixing the issue. Stay tuned ${getEmoji(
            "NEKOSAD"
          )}.`,
          color: msgColors.ERROR,
        },
      ],
    })
  }
}
