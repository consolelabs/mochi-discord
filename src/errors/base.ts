import {
  CommandInteraction,
  Message,
  MessageComponentInteraction,
  TextChannel,
} from "discord.js"
import { TEST } from "env"
import { logger } from "logger"
import { kafkaQueue } from "queue/kafka/queue"
import {
  eventAsyncStore,
  slashCommandAsyncStore,
  textCommandAsyncStore,
} from "utils/async-storages"
import { somethingWentWrongPayload } from "utils/error"
import { stack } from "utils/stack-trace"

export type OriginalMessage =
  | Message
  | MessageComponentInteraction
  | CommandInteraction

type ReplyFunc = (otps: any) => Promise<void>

// Base or "catch-all" error, do not throw this directly
export class BotBaseError extends Error {
  protected msgOrInteraction?: OriginalMessage
  protected reply: ReplyFunc = async () => await Promise.resolve()

  protected user = "Unknown"
  protected channel = "DM"
  protected guild = "DM"
  private reference?: Promise<Message>
  private messageObj?:
    | {
        guild_id: string
        channel_id: string
        discord_id: string
        error: string
        command: string
      }
    | {
        log: string
        stack: string
      }

  constructor(message?: OriginalMessage, errorMessage?: string) {
    super()
    this.name = "Something went wrong (unexpected error)"

    const reply = (message?.reply as ReplyFunc)?.bind(message)

    if (message instanceof Message) {
      this.reply = async (...args) => {
        await reply(...args).catch(() => null)
      }
    } else {
      this.reply = async (...args) => {
        if (message && !message.deferred) {
          await message.deferReply().catch(() => null)
        }
        await message?.editReply(...args).catch(() => null)
      }
    }

    const store =
      textCommandAsyncStore.getStore() ||
      slashCommandAsyncStore.getStore() ||
      eventAsyncStore.getStore()

    this.msgOrInteraction = message

    if (store) {
      this.messageObj = {
        ...JSON.parse(store.data),
        ...(errorMessage ? { error: errorMessage } : {}),
      }
    } else {
      let command = ""
      if (message) {
        if (message instanceof Message) {
          command = message.content
        } else if (message.isCommand()) {
          command = message.toString()
        } else {
          const msg = message.message as Message
          if (msg.type === "DEFAULT" && msg.reference) {
            this.reference = msg.fetchReference()
          }
          if (
            msg.type === "APPLICATION_COMMAND" &&
            msg.interaction?.commandName
          ) {
            command = msg.interaction?.commandName
          }
        }

        this.channel = (message.channel as TextChannel)?.id ?? "DM"
        this.guild = message.guild?.id ?? "DM"
        this.user = "author" in message ? message.author?.id : message.user?.id
        this.messageObj = {
          guild_id: this.guild,
          channel_id: this.channel,
          discord_id: this.user,
          error: errorMessage ?? "",
          command,
        }
      } else if (errorMessage) {
        this.messageObj = {
          log: errorMessage,
          stack: TEST ? "" : stack.clean(this.stack ?? ""),
        }
      }
    }
  }

  private _handle() {
    const error = {
      name: this.name,
      message: this.message,
    }
    logger.error(error)
    kafkaQueue?.produceAnalyticMsg([this.message]).catch(() => null)
    this.reply(somethingWentWrongPayload())
  }

  handle() {
    if (this.reference) {
      this.reference.then((msg) => {
        if (this.messageObj && "command" in this.messageObj) {
          this.messageObj.command = msg.content
          this.message = JSON.stringify(this.messageObj)
          this._handle()
        }
      })
    } else {
      this.message = JSON.stringify(this.messageObj)
      this._handle()
    }
  }
}
