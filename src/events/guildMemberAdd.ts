import { Event } from "."
import Discord, { Collection, Role } from "discord.js"
import config from "adapters/config"
import webhook from "../adapters/webhook"
import { DISCORD_DEFAULT_AVATAR } from "env"
import { createBEGuildMember } from "../types/webhook"
import { composeEmbedMessage } from "utils/discord-embed"
import defaultRole from "adapters/defaultRole"
import { logger } from "logger"
import { DefaultRole, DefaultRoleResponse } from "types/common"

export default {
  name: "guildMemberAdd",
  once: false,
  execute: async (member: Discord.GuildMember) => {
    await setUserDefaultRoles(member)
    const resp = await webhook.pushDiscordWebhook("guildMemberAdd", createBEGuildMember(member))
    const guild = await config.getGuild(member.guild.id)
    const logChannel = member.guild.channels.cache.find(
      (channel) => channel.id === guild.log_channel_id
    ) as Discord.TextChannel
    
    if (resp.error) {
      sendInviteTrackerMessage(logChannel, unknowErrorMsg(member.id), member.user.avatarURL())
      return
    }
    
    const data = resp.data
    if (data.is_bot) {
      sendInviteTrackerMessage(logChannel, botInviteMsg(member.id), member.user.avatarURL())
      return
    }
    if (data.is_vanity) {
      sendInviteTrackerMessage(logChannel, vantityInviteMsg(member.id), member.user.avatarURL())
      return
    }
    sendInviteTrackerMessage(logChannel, inviteMsg(member.id, data.inviter_id, data.invites_amount), member.user.avatarURL())
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
    thumbnail: thumbnail || DISCORD_DEFAULT_AVATAR,
  })
  logChannel.send({ embeds: [embed] })
}

async function setUserDefaultRoles(member: Discord.GuildMember) {
  const resData: DefaultRoleResponse = await defaultRole.getAllDefaultRoles()

  if (resData.success) {
    const defaultRoleIDs: string[] = resData.data.map((r: DefaultRole) => r.role_id)
    const roles: Collection<string, Role> = member.guild?.roles?.cache.filter(role => defaultRoleIDs.includes(role.id));

    roles.forEach(async r => {
      await member.roles.add(r)
    })
  }

}