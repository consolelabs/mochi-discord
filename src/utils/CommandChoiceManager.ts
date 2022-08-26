import {
  ButtonInteraction,
  Client,
  InteractionReplyOptions,
  Message,
  MessageActionRow,
  MessageComponentInteraction,
  MessageEmbed,
  MessageOptions,
  SelectMenuInteraction,
  TextChannel,
} from "discord.js"
import { inactivityResponse } from "./common"

export type EphemeralMessage = {
  embeds: MessageEmbed[]
  components?: MessageActionRow[]
  buttonCollector?: (i: ButtonInteraction) => Promise<MessageOptions>
}

export type CommandChoiceHandlerResult = {
  messageOptions: InteractionReplyOptions | MessageOptions
  commandChoiceOptions?: Partial<CommandChoiceHandlerOptions>
  ephemeralMessage?: EphemeralMessage
}

export type CommandChoiceHandler = (
  msgOrInteraction: Message | MessageComponentInteraction
) => Promise<CommandChoiceHandlerResult>

export type CommandChoiceHandlerOptions = {
  handler: CommandChoiceHandler
  getInactivityResponse?: (...arg: any) => Promise<MessageOptions>
  userId: string
  messageId: string
  channelId: string
  guildId: string | null
  timeout?: number
  interaction?: ButtonInteraction | SelectMenuInteraction
  data?: any
}

export class CommandChoiceManager {
  commands: Map<string, Partial<CommandChoiceHandlerOptions>> = new Map()
  timeouts: Map<string, NodeJS.Timeout> = new Map()
  client: Client | null = null

  remove(key: string) {
    this.commands.delete(key)
    const timeoutId = this.timeouts.get(key)
    if (timeoutId) {
      global.clearTimeout(timeoutId)
    }
    this.timeouts.delete(key)
  }

  async update(key: string, newValue: Partial<CommandChoiceHandlerOptions>) {
    const options = this.commands.get(key)
    const updatedValue = {
      ...options,
      ...newValue,
    }
    this.commands.set(key, {
      ...updatedValue,
    })
    if (options) {
      await this.queueAutoClose({
        ...updatedValue,
        key,
      })
    }
  }

  async get(key: string) {
    return this.commands.get(key)
  }

  async add(options: CommandChoiceHandlerOptions) {
    const {
      channelId,
      userId,
      guildId,
      messageId,
      getInactivityResponse = inactivityResponse,
      timeout = 0,
    } = options
    const key = `${userId}_${guildId}_${channelId}`
    await this.queueAutoClose({
      guildId,
      channelId,
      messageId,
      getInactivityResponse,
      userId,
      timeout,
      key,
    })

    this.commands.set(key, { ...options, timeout, getInactivityResponse })
  }

  async queueAutoClose({
    key,
    timeout,
    userId,
    guildId,
    channelId,
    messageId,
    interaction,
    getInactivityResponse,
    clearPrevious = true,
  }: Partial<CommandChoiceHandlerOptions> & {
    key: string
    clearPrevious?: boolean
  }) {
    if (!timeout || timeout <= 0) return
    if (clearPrevious) {
      const timeoutId = this.timeouts.get(key)
      if (timeoutId) {
        global.clearTimeout(timeoutId)
      }
    }

    const guild = await this.client?.guilds.fetch(guildId ?? "")
    const user = await this.client?.users.fetch(userId ?? "")
    const channel = (await guild?.channels.fetch(
      channelId ?? ""
    )) as TextChannel
    const timeoutId = global.setTimeout(async () => {
      const response = await getInactivityResponse?.(user)
      if (interaction) {
        await interaction.editReply({
          content: "Exited!",
          embeds: [],
          components: [],
        })
      } else {
        const message = await channel.messages.fetch(messageId ?? "")
        await message.delete()
      }

      if (response) {
        channel.send(response)
      }
      this.remove(key)
    }, timeout)

    this.timeouts.set(key, timeoutId)
  }
}

export default new CommandChoiceManager()
