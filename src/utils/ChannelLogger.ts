import { Client, Message, MessageEmbed, TextChannel } from "discord.js"
import {
  ALERT_CHANNEL_ID,
  API_SERVER_HOST,
  LOG_CHANNEL_ID,
  MOCHI_GUILD_ID,
} from "env"
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

  alert(msg: Message, error: BotBaseError) {
    if (!this.alertChannel || !msg.content.startsWith(PREFIX)) {
      return
    }

    const description = `**Command:** \`${msg.content}\`\n**Guild:** \`${
      msg.channel.type === "DM" ? "DM" : msg.guild?.name
    }\`\n**Channel:** \`${
      msg.channel.type === "DM" ? "DM" : msg.channel.name ?? msg.channelId
    }\`\n**Error:** \`\`\`${error?.message}\`\`\``
    const embed = getErrorEmbed({
      msg,
      title: "Command error",
      description,
    }).setTimestamp()
    this.alertChannel.send({ embeds: [embed] })
  }

  apiAlert({
    url,
    query,
    error,
    code,
  }: {
    url: string
    query: Record<string, any>
    error: string
    code?: number
  }) {
    if (!this.alertChannel) {
      return
    }
    const fields = []
    fields.push(`**Endpoint:** \`${url.replace(API_SERVER_HOST, "")}\``)
    fields.push(`**Query:** \`${JSON.stringify(query)}\``)
    fields.push(`**Code:** \`${code}\``)
    fields.push(`**Error:** \`\`\`${error}\`\`\``)
    const description = fields.join("\n")
    const embed = getErrorEmbed({
      title: "API error",
      description,
    }).setTimestamp()
    this.alertChannel.send({ embeds: [embed] })
  }
}

export default new ChannelLogger()
