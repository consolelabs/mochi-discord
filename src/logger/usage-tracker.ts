import { Client, CommandInteraction, Message, TextChannel } from "discord.js"
import { MOCHI_GUILD_ID, USAGE_TRACKING_CHANNEL_ID } from "env"
import { composeEmbedMessage } from "ui/discord/embed"
import { wrapError } from "utils/wrap-error"

export class UsageTrackerLogger {
  private logChannel: TextChannel | null = null

  ready(client: Client) {
    wrapError(null, async () => {
      const guild = client.guilds.cache.get(MOCHI_GUILD_ID)
      if (guild) {
        this.logChannel = guild.channels.cache.get(
          USAGE_TRACKING_CHANNEL_ID
        ) as TextChannel
      }
    })
  }

  log(msg: Message | CommandInteraction) {
    if (this.logChannel) {
      let content = ""
      let authorName = ""
      let authorAvatar = ""
      if (msg instanceof Message) {
        content = msg.content
        authorName = msg.author.username
        authorAvatar = msg.author.avatarURL() ?? ""
      }
      if (msg instanceof CommandInteraction) {
        content = `**Slash Command:** ${msg.commandName}`
        authorName = msg.user.username
        authorAvatar = msg.user.avatarURL() ?? ""
      }
      const embed = composeEmbedMessage(null, {
        description: content,
        author: [msg.guild?.name ?? "", msg.guild?.bannerURL() ?? ""],
      })
        .setTimestamp()
        .setFooter({ text: authorName, iconURL: authorAvatar })
        .setAuthor({
          name: msg.guild?.name ?? "",
          iconURL: msg.guild?.bannerURL() ?? "",
        })
      this.logChannel.send({
        embeds: [embed],
      })
    }
  }
}

export default new UsageTrackerLogger()
