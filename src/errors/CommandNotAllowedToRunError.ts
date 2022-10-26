import { Message, TextChannel } from "discord.js"
import { getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError } from "./BaseError"

export class CommandNotAllowedToRunError extends BotBaseError {
  private discordMessage: Message
  private missingPermissions: string[]

  constructor({
    message,
    command,
    missingPermissions = [],
  }: {
    message: Message
    command: string
    missingPermissions?: string[]
  }) {
    super()
    this.name = "Command not allowed to run"
    this.discordMessage = message
    this.missingPermissions = missingPermissions
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild?.name,
      channel: channel.name,
      user: message.author.tag,
      data: { command },
    })
  }

  handle() {
    let errorEmbed
    if (this.missingPermissions?.length) {
      errorEmbed = getErrorEmbed({
        msg: this.discordMessage,
        title: `Insufficient permissions`,
        description: `Only Administrators of this server can run this command.`,
      })
    } else {
      errorEmbed = getErrorEmbed({
        msg: this.discordMessage,
        description: "This command is not allowed to run in DM",
      })
    }
    this.discordMessage.reply({
      embeds: [errorEmbed],
    })
  }
}
