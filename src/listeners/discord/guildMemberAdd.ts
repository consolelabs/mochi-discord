import { DiscordEvent } from "."
import Discord from "discord.js"
import config from "adapters/config"
import { logger } from "logger"
import client from "index"
import { getEmoji, roundFloatNumber } from "utils/common"
import { wrapError } from "utils/wrap-error"
import { createBEGuildMember } from "types/webhook"
import webhook from "adapters/webhook"
import { getErrorEmbed } from "ui/discord/embed"
import { eventAsyncStore } from "utils/async-storages"

const event: DiscordEvent<"guildMemberAdd"> = {
  name: "guildMemberAdd",
  once: false,
  execute: async (member) => {
    const metadata = {
      sub_event_type: "guildMemberAdd",
      guild_id: member.guild.id,
      discord_id: member.user.id,
    }

    eventAsyncStore.run(
      {
        data: JSON.stringify(metadata),
      },
      async () => {
        await wrapError(metadata, async () => {
          await setUserDefaultRoles(member)

          await welcomeNewMember(member)

          await webhook.pushDiscordWebhook(
            "guildMemberAdd",
            createBEGuildMember(member)
          )
        })
      }
    )
  },
}

export default event

async function setUserDefaultRoles(member: Discord.GuildMember) {
  const { ok, data } = await config.getCurrentDefaultRole(member.guild.id)
  if (ok && data.role_id) {
    await member.roles.add(data.role_id)
  }
}

async function welcomeNewMember(member: Discord.GuildMember) {
  const welcomeChannel = await config.getCurrentWelcomeConfig(member.guild.id)
  if (!welcomeChannel.ok || !welcomeChannel.data) return

  const configData = welcomeChannel.data
  if (
    !configData.channel_id ||
    !configData.guild_id ||
    !configData.welcome_message
  ) {
    logger.warn(
      `[guildMemberAdd/${member.guild.id}] - welcome channel configs invalid`
    )
    return
  }
  // channel id returned but cannot find in guild
  const chan = await client.channels
    .fetch(configData.channel_id)
    .catch(() => null)
  if (!chan) {
    const guild = await config.getGuild(member.guild.id)
    if (!guild) {
      logger.warn(
        `[guildMemberAdd/${member.guild.id}] - failed to get guild data`
      )
      return
    }

    const logChannel = member.guild.channels.cache.find(
      (channel) => channel.id === guild?.log_channel_id
    )
    if (logChannel?.isText()) {
      logChannel.send({
        embeds: [
          getErrorEmbed({
            description: "Welcome channel not found",
          }),
        ],
      })
    }
    return
  }

  const welcomeMsg = configData.welcome_message
    .replaceAll("$name", `<@${member.id}>`)
    .replaceAll(`\\n`, "\n")

  if (chan.isText()) {
    chan.send({ content: welcomeMsg })
  }
}

export const getChangePercentage = (change: number) => {
  const trend =
    change > 0
      ? getEmoji("ANIMATED_CHART_INCREASE", true)
      : change === 0
      ? ""
      : getEmoji("DECREASING")
  return `${trend} ${change > 0 ? "+" : ""}${roundFloatNumber(change, 2)}%`
}
