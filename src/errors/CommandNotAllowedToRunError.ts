import { Message, TextChannel } from "discord.js"
import { defaultEmojis } from "utils/common"
import { getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError } from "./BaseError"

export class CommandNotAllowedToRunError extends BotBaseError {
  private discordMessage: Message
  private missingPermissions: string[]

  constructor({
    message,
    command,
    missingPermissions,
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
    super.handle()
    let errorEmbed
    if (this.missingPermissions) {
      errorEmbed = getErrorEmbed({
        msg: this.discordMessage,
        title: `${defaultEmojis.ERROR} Insufficient permissions`,
        description: `<@${this.discordMessage.author.id}>, you need the following permissions on this channel to run this command`,
      }).addField("Missing permissions", this.missingPermissions.join(", "))
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
