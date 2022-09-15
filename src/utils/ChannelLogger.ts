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
import { BotBaseError } from "errors"
import { logger } from "logger"
import { PREFIX } from "./constants"
import { getErrorEmbed } from "./discordEmbed"

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

  log(error: BotBaseError, funcName?: string) {
    if (this.logChannel) {
      if (funcName) {
        const embed = new MessageEmbed()
          .setTimestamp()
          .setDescription(
            `\`\`\`bot crashed due to reason: ${funcName} ${error}\`\`\``
          )
        this.logChannel.send({
          embeds: [embed],
        })
      } else {
        const embed = new MessageEmbed()
          .setTimestamp()
          .setDescription(`\`\`\`bot crashed due to reason: ${error}\`\`\``)
        this.logChannel.send({
          embeds: [embed],
        })
      }
    }
  }

  alertSlash(commandInteraction: CommandInteraction, error: BotBaseError) {
    if (!this.alertChannel) {
      return
    }

    const isDM = !!commandInteraction.guildId
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
    const embed = getErrorEmbed({
      title: error.name || "Slash Command error",
      description,
    }).setTimestamp()
    this.alertChannel.send({
      embeds: [embed],
    })
  }

  alert(msg: Message, error: BotBaseError) {
    if (!this.alertChannel || !msg.content.startsWith(PREFIX)) {
      return
    }

    const description = `**Command:** \`${msg.content}\`\n**Guild:** \`${
      msg.channel.type === "DM" ? "DM" : msg.guild?.name
    }\`\n**Channel:** \`${
      msg.channel.type === "DM" ? "DM" : msg.channel.name ?? msg.channelId
    }\`\n**Error:** ${
      error?.message
        ? `\`\`\`${error.message}\`\`\``
        : "Error without message, this is likely an unexpected error"
    }`
    const embed = getErrorEmbed({
      msg,
      title: error.name || "Command error",
      description,
    }).setTimestamp()
    this.alertChannel.send({
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

  alertWebhook(event: string, data: any) {
    this.alertChannel?.send({
      embeds: [
        getErrorEmbed({
          title: "Webhook Error",
          description: `**Event:** ${event}\`\`\`${JSON.stringify(
            data,
            null,
            4
          )}\`\`\``,
        }).setTimestamp(),
      ],
    })
  }
}

export default new ChannelLogger()
