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
        this.conversations.delete(userId)
        return
      }
    } else {
      if (!this.hasConversation(userId, channelId, msgOrInteraction)) return
      if (msgOrInteraction?.customId.startsWith("exit-")) {
        this.conversations.delete(userId)
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

        if (end || !nextHandler) return

        this.conversations
          .get(userId)
          ?.set(channelId, { msg: originalMsg, handler: nextHandler })
      })
    }
  }
}

export default new ConversationManager()
