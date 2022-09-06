import { CommandInteraction, Message, TextChannel } from "discord.js"
import { BotBaseError } from "./BaseError"

// TODO: remove after slash command migration done
export class CommandIsNotScopedError extends BotBaseError {
  constructor({
    message,
    category,
    command,
  }: {
    message: Message
    category: string
    command: string
  }) {
    super()
    this.name = "Command is not scoped"
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild?.name,
      channel: channel.name,
      user: message.author.tag,
      data: { category, command },
    })
  }
}

export class SlashCommandIsNotScopedError extends BotBaseError {
  constructor({
    interaction,
    category,
    command,
  }: {
    interaction: CommandInteraction
    category: string
    command: string
  }) {
    super()
    this.name = "Slash command is not scoped"
    const channel = interaction.channel as TextChannel
    this.message = JSON.stringify({
      guild: interaction.guild?.id,
      channel: channel.id,
      user: interaction.user.id,
      data: { category, command },
    })
  }
}
