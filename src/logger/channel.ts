import {
  Client,
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  TextChannel,
} from "discord.js"
import { ALERT_CHANNEL_ID, LOG_CHANNEL_ID, MOCHI_GUILD_ID } from "env"
import { APIError, BotBaseError } from "errors"
import { logger } from "logger"

export class ChannelLogger {
  logChannel: TextChannel | null = null
  private alertChannel: TextChannel | null = null

  ready(client: Client) {
    try {
      const guild = client.guilds.cache.get(MOCHI_GUILD_ID)
      if (guild) {
        this.alertChannel = guild.channels.cache.get(
          ALERT_CHANNEL_ID
        ) as TextChannel
        this.logChannel = guild.channels.cache.get(
          LOG_CHANNEL_ID
        ) as TextChannel
      }
    } catch (e: any) {
      logger.error(e)
    }
  }

  alertSlash(commandInteraction: CommandInteraction, error: BotBaseError) {
    if (!this.alertChannel) {
      return Promise.resolve({})
    }

    const isDM = !commandInteraction.guildId
    const channelName = (commandInteraction.channel as TextChannel).name

    const description = `**Slash Command:** \`${
      commandInteraction.commandName
    }\`\n**Guild:** \`${
      isDM ? "DM" : commandInteraction.guild?.name
    }\`\n**Channel:** \`${isDM ? "DM" : channelName}\`\n**Error:** ${
      error?.message
        ? `\`\`\`${error.message}\`\`\``
        : "Error without message, this is likely an unexpected error"
    }`
    const embed = new MessageEmbed({
      title: error.name || "Slash Command error",
      description,
    }).setTimestamp()
    return this.alertChannel.send({
      embeds: [embed],
    })
  }

  alert<T extends BotBaseError>(msg: Message, error: T) {
    if (!this.alertChannel) {
      return Promise.resolve({})
    }

    let description = `**Command:** \`${msg.content}\`\n**Guild:** \`${
      msg.channel.type === "DM" ? "DM" : msg.guild?.name
    }\`\n**Channel:** \`${
      msg.channel.type === "DM" ? "DM" : msg.channel.name ?? msg.channelId
    }\`\n**Error:** ${
      error?.message
        ? `\`\`\`${error.message}\`\`\``
        : "Error without message, this is likely an unexpected error"
    }`
    if (error instanceof APIError) {
      description = `${description}\n**Curl:**\n\`\`\`${error.curl}\`\`\``
    }
    const embed = new MessageEmbed({
      title: error.name || "Command error",
      description,
      footer: {
        text: msg?.author?.tag ?? "Unknown User",
        iconURL: msg?.author?.avatarURL() ?? undefined,
      },
    }).setTimestamp()
    return this.alertChannel.send({
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setStyle("LINK")
            .setURL(msg.url)
            .setLabel("Jump to message")
        ),
      ],
    })
  }

  alertWebhook(event: string, error: APIError) {
    if (!this.alertChannel) {
      return Promise.resolve({})
    }
    return this.alertChannel?.send({
      embeds: [
        new MessageEmbed({
          title: "Webhook Error",
          description: `**Event:** \`${event}\`\n**Message:**\`\`\`${error.message}\`\`\`\n**Curl:**\`\`\`${error.curl}\`\`\``,
        }).setTimestamp(),
      ],
    })
  }

  alertStackTrace(stack: string) {
    if (!this.alertChannel) {
      return Promise.resolve({})
    }
    return this.alertChannel?.send({
      embeds: [
        new MessageEmbed({
          title: "Internal Error",
          description: `**Trace:** \`\`\`${stack}\`\`\``,
        }).setTimestamp(),
      ],
    })
  }
}

export default new ChannelLogger()
