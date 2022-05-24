import { Event } from "."
import Discord from "discord.js"
import config from "adapters/config"
import webhook from "../adapters/webhook"
import { DISCORD_DEFAULT_AVATAR } from "env"
import { createBEGuildMember } from "../types/webhook"
import { composeEmbedMessage } from "utils/discordEmbed"
import { DefaultRoleResponse } from "types/common"
import ChannelLogger from "utils/ChannelLogger"
import { logger } from "logger"
import { BotBaseError } from "errors"

export default {
  name: "guildMemberAdd",
  once: false,
  execute: async (member: Discord.GuildMember) => {
    try {
      await setUserDefaultRoles(member)
      const res = await webhook.pushDiscordWebhook(
        "guildMemberAdd",
        createBEGuildMember(member)
      )
      const guild = await config.getGuild(member.guild.id)
      const logChannel = member.guild.channels.cache.find(
        channel => channel.id === guild.log_channel_id
      ) as Discord.TextChannel

      if (res.error) {
        sendInviteTrackerMessage(
          logChannel,
          unknowErrorMsg(member.id),
          member.user.avatarURL()
        )
        return
      }

      const data = res.data
      if (data.is_bot) {
        sendInviteTrackerMessage(
          logChannel,
          botInviteMsg(member.id),
          member.user.avatarURL()
        )
        return
      }
      if (data.is_vanity) {
        sendInviteTrackerMessage(
          logChannel,
          vantityInviteMsg(member.id),
          member.user.avatarURL()
        )
        return
      }
      sendInviteTrackerMessage(
        logChannel,
        inviteMsg(member.id, data.inviter_id, data.invites_amount),
        member.user.avatarURL()
      )
    } catch (e) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e as string)
      }
      ChannelLogger.log(error)
    }
  }
} as Event<"guildMemberAdd">

function unknowErrorMsg(memberID: string) {
  return `I can not figure out how <@${memberID}> joined the server.`
}

function vantityInviteMsg(memberID: string) {
  return `<@${memberID}> joined using a vanity invite.`
}

function botInviteMsg(memberID: string) {
  return `<@${memberID}> joined using  using OAuth.`
}

function inviteMsg(memberID: string, inviterID: string, inviteAmount: number) {
  return `<@${memberID}> has been invited by <@${inviterID}> and has now ${inviteAmount} invites.`
}

function sendInviteTrackerMessage(
  logChannel: Discord.TextChannel,
  msg: string,
  thumbnail?: string
) {
  const embed = composeEmbedMessage(null, {
    title: "Invite Tracker",
    description: msg,
    thumbnail: thumbnail || DISCORD_DEFAULT_AVATAR
  })
  logChannel.send({ embeds: [embed] })
}

async function setUserDefaultRoles(member: Discord.GuildMember) {
  const json: DefaultRoleResponse = await config.getCurrentDefaultRole(
    member.guild.id
  )

  if (json.success) {
    await member.roles.add(json.data.role_id)
  }
}
