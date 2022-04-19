import { Event } from "."
import Discord from "discord.js"
import client from "../index"
import { invites } from "./index"
import { logger } from "../logger"
import Community from "../adapter/community"
import { InviteHistoryInput, InviteeCountInput } from "types/community"
import config from "adapter/config"
import { composeEmbedMessage } from "utils/discord-embed"
import { DISCORD_DEFAULT_AVATAR } from "env"
import Profile from "../adapter/profile"
import { UserInput } from "types/profile"

export default {
  name: "guildMemberAdd",
  once: false,
  execute: async (member: Discord.GuildMember) => {
    const newInvites = await member.guild.invites.fetch()
    const oldInvites = invites.get(member.guild.id)
    const invite = newInvites.find(
      (i) =>
        i.uses > (oldInvites as Discord.Collection<string, number>).get(i.code)
    )
    ;(invites.get(invite.guild.id) as Discord.Collection<string, number>).set(
      invite.code,
      invite.uses
    )
    const inviter = await client.users.fetch(invite.inviter.id)
    const guild = await config.getGuild(member.guild.id)
    const logChannel = member.guild.channels.cache.find(
      (channel) => channel.id === guild.log_channel_id
    ) as Discord.TextChannel

    const indexInviterResponse = await Profile.createUser({
      id: inviter.id,
      username: inviter.username,
      guild_id: member.guild.id,
    } as UserInput)
    if (indexInviterResponse.error) {
      logger.error(`Error indexing inviter: ${indexInviterResponse.error}`)
      sendInviteTrackerMessage(logChannel, unknowErrorMsg(member.user.id))
      return
    }

    const indexInviteeResponse = await Profile.createUser({
      id: member.user.id,
      username: member.user.username,
      guild_id: member.guild.id,
    } as UserInput)
    if (indexInviteeResponse.error) {
      logger.error(`Error indexing invitee: ${indexInviteeResponse.error}`)
      sendInviteTrackerMessage(logChannel, unknowErrorMsg(member.user.id))
      return
    }

    if (inviter) {
      const createInviteHistoryResponse = await Community.createInviteHistory({
        guild_id: member.guild.id,
        inviter: inviter.id,
        invitee: member.user.id,
      } as InviteHistoryInput)
      if (createInviteHistoryResponse.error) {
        logger.error(
          `Error indexing invite history: ${createInviteHistoryResponse.error}`
        )
        sendInviteTrackerMessage(logChannel, unknowErrorMsg(member.user.id))
        return
      }

      const inviteAmountResponse = await Community.getInvitees({
        guild_id: member.guild.id,
        inviter: inviter.id,
      } as InviteeCountInput)
      if (inviteAmountResponse.error) {
        logger.error(
          `Error getting invite amount: ${inviteAmountResponse.error}`
        )
        sendInviteTrackerMessage(logChannel, unknowErrorMsg(member.user.id))
        return
      }
      sendInviteTrackerMessage(
        logChannel,
        inviteMsg(member.user.id, inviter.id, inviteAmountResponse.data),
        member.user.avatarURL()
      )
    } else {
      sendInviteTrackerMessage(
        logChannel,
        vantityInviteMsg(member.user.id),
        member.user.avatarURL()
      )
    }
  },
} as Event<"guildMemberAdd">

function unknowErrorMsg(memberID: string) {
  return `I can not figure out how <@${memberID}> joined the server.`
}

function vantityInviteMsg(memberID: string) {
  return `<@${memberID}> joined using a vanity invite.`
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

