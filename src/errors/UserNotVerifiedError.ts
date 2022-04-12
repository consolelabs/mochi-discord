import { originalCommands } from "commands"
import { Message, MessageEmbed, TextChannel } from "discord.js"
import { PREFIX } from "env"
import guildConfig from "modules/guildConfig"
import { getEmbedFooter } from "utils/discord"
import { NekoBotBaseError } from "./BaseError"

export class UserNotVerifiedError extends NekoBotBaseError {
  private discordMessage: Message
  private isAdmin: boolean

  constructor({ message, discordId }: { message: Message; discordId: string }) {
    super()
    this.isAdmin = discordId !== message.author.id
    this.discordMessage = message
    this.name = "User not verified"
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild.name,
      channel: channel.name,
      user: message.author.tag,
      data: { discordId },
    })
  }

  handle() {
    super.handle()
    const verifyCommand = originalCommands.verify.command
    const description = this.isAdmin
      ? "Cannot get user profile due to unverification"
      : `Please head to <#${guildConfig.getVerifyChannelId(
          this.discordMessage.guildId
        )}> and run \`${PREFIX}${verifyCommand}\``
    const embed = new MessageEmbed()
      .setColor("#d91c22")
      .setTitle("User not verified")
      .setDescription(description)
      .setFooter(
        getEmbedFooter([`${this.discordMessage.author.tag}`]),
        this.discordMessage.author.avatarURL()
      )
    this.discordMessage.channel.send({ embeds: [embed] })
  }
}
