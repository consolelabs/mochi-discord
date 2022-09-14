import { Message, MessageComponentInteraction, TextChannel } from "discord.js"
import { getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError } from "./BaseError"

export class GuildIdNotFoundError extends BotBaseError {
  private errorMsg: string

  constructor({ message }: { message: Message | MessageComponentInteraction }) {
    super(message)
    this.name = "Guild ID not found"
    this.errorMsg =
      "User invoked a command that was likely in a DM because guild id can not be found"
    const channel = message.channel as TextChannel
    const user = "author" in message ? message.author.tag : message.user.tag
    this.message = JSON.stringify({
      guild: message.guild ? message.guild.name : "",
      channel: channel?.name ?? "DM",
      user,
    })
  }

  handle() {
    this.msgOrInteraction?.reply({
      embeds: [
        getErrorEmbed({
          title: "This command must be run in a guild",
          description: this.errorMsg,
        }),
      ],
    })
  }
}
