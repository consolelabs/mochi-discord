import { CommandInteraction, Message, TextChannel } from "discord.js"
import { getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError } from "./BaseError"

export class DiscordWalletTransferError extends BotBaseError {
  private discordMessageOrInteraction: Message | CommandInteraction
  private errorMsg: string

  constructor({
    discordId,
    guildId,
    messageOrInteraction,
    errorMsg,
  }: {
    discordId?: string
    guildId: string
    messageOrInteraction: Message | CommandInteraction
    errorMsg?: string
  }) {
    super()
    this.name = "Discord wallet transfer error"
    this.discordMessageOrInteraction = messageOrInteraction
    this.errorMsg = errorMsg ?? "Something went wrong"
    const channel = messageOrInteraction.channel as TextChannel
    this.message = JSON.stringify({
      guild: messageOrInteraction.guild ? messageOrInteraction.guild.name : "",
      channel: channel ? channel.name : "dm",
      user:
        messageOrInteraction instanceof Message
          ? messageOrInteraction.author.tag
          : messageOrInteraction.user.tag,
      data: { discordId, guildId },
    })
  }

  handle() {
    super.handle()
    this.discordMessageOrInteraction.channel?.send({
      embeds: [
        getErrorEmbed({
          msg:
            this.discordMessageOrInteraction instanceof Message
              ? this.discordMessageOrInteraction
              : undefined,
          title: "Transaction error",
          description: this.errorMsg,
        }),
      ],
    })
  }
}
