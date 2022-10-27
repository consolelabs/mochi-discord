import {
  ButtonInteraction,
  Message,
  MessageEditOptions,
  SelectMenuInteraction,
} from "discord.js"

type HandlerResult = {
  end: boolean
  editOptions: MessageEditOptions
  nextHandler: Handler | null
}

const DEFAULT_TIMEOUT = 300000

export type Handler = (
  msgOrInteraction: Message | ButtonInteraction | SelectMenuInteraction,
  originalMessage: Message
) => Promise<HandlerResult>

class ConversationManager {
  // user id => channel id => handler & original message
  private conversations: Map<
    string,
    Map<string, { msg: Message; handler: Handler }>
  > = new Map()

  private timeouts: Map<string, Map<string, NodeJS.Timeout>> = new Map()

  scheduleTimeout(userId: string, channelId: string, msg: Message) {
    globalThis.clearTimeout(this.timeouts.get(userId)?.get(channelId))
    const timeout = globalThis.setTimeout(() => {
      this.conversations.get(userId)?.delete(channelId)
      if (msg.deletable) {
        msg.delete()
      }
    }, DEFAULT_TIMEOUT)

    if (this.timeouts.has(userId)) {
      this.timeouts.get(userId)?.set(channelId, timeout)
    } else {
      this.timeouts.set(userId, new Map([[channelId, timeout]]))
    }
  }

  startConversation(
    userId: string,
    channelId: string,
    data: { msg: Message; handler: Handler }
  ) {
    const channelsMap = this.conversations.get(userId)
    if (channelsMap) {
      channelsMap.set(channelId, data)
    } else {
      const newChannelsMap = new Map([[channelId, data]])
      this.conversations.set(userId, newChannelsMap)
    }

    this.scheduleTimeout(userId, channelId, data.msg)
  }

  hasConversation(
    userId: string,
    channelId: string,
    interaction?: ButtonInteraction | SelectMenuInteraction
  ) {
    const data = this.conversations.get(userId)?.get(channelId)
    if (interaction && data) {
      return data.msg.id === interaction.message.id
    }
    return !!data
  }

  continueConversation(
    userId: string,
    channelId: string,
    msgOrInteraction: Message | ButtonInteraction | SelectMenuInteraction
  ) {
    if (msgOrInteraction instanceof Message) {
      if (!this.hasConversation(userId, channelId)) return
      if (msgOrInteraction.content.toLowerCase().trim() === "exit") {
        this.conversations.get(userId)?.delete(channelId)
        return
      }
    } else {
      if (!this.hasConversation(userId, channelId, msgOrInteraction)) return
      if (msgOrInteraction?.customId.startsWith("exit-")) {
        this.conversations.get(userId)?.delete(channelId)
        return
      }
    }
    const data = this.conversations.get(userId)?.get(channelId)
    if (data) {
      const { msg: originalMsg, handler } = data
      handler?.(msgOrInteraction, originalMsg).then((r) => {
        const { end, editOptions, nextHandler } = r

        if (editOptions) {
          originalMsg.edit(editOptions)
        }

        if (msgOrInteraction instanceof Message && msgOrInteraction.deletable) {
          msgOrInteraction.delete()
        }

        if (end || !nextHandler) {
          this.conversations.get(userId)?.delete(channelId)
          return
        }

        this.scheduleTimeout(userId, channelId, originalMsg)

        this.conversations
          .get(userId)
          ?.set(channelId, { msg: originalMsg, handler: nextHandler })
      })
    }
  }
}

export default new ConversationManager()
