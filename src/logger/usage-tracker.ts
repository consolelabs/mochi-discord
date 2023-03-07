import { Client, CommandInteraction, Message, TextChannel } from "discord.js"
import { MOCHI_GUILD_ID, USAGE_TRACKING_CHANNEL_ID } from "env"
import { composeEmbedMessage } from "ui/discord/embed"
import { getAuthor } from "utils/common"
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
      const author = getAuthor(msg)
      const isMessage = msg instanceof Message
      const content = isMessage
        ? msg.content
        : `**Slash Command:** ${msg.commandName}`
      const embed = composeEmbedMessage(null, {
        description: content,
        author: [msg.guild?.name ?? "", msg.guild?.iconURL() ?? ""],
      }).setFooter({ text: author.username, iconURL: author.avatarURL() ?? "" })
      this.logChannel.send({
        embeds: [embed],
      })
    }
  }
}

export default new UsageTrackerLogger()
