import { Event } from "."
import Discord from "discord.js"
import config from "adapters/config"
import webhook from "../adapters/webhook"
import { DISCORD_DEFAULT_AVATAR } from "env"
import { createBEGuildMember } from "../types/webhook"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import ChannelLogger from "utils/ChannelLogger"
import { logger } from "logger"
import { BotBaseError } from "errors"
import client from "index"
import Profile from "adapters/profile"

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
        (channel) => channel.id === guild?.log_channel_id
      )

      if (!res || res.error) {
        sendInviteTrackerMessage(
          member.guild.id,
          unknowErrorMsg(member.id),
          logChannel,
          member.user.avatarURL() ?? ""
        )
        return
      }

      const data = res.data
      if (data.is_invitee_a_bot) {
        sendInviteTrackerMessage(
          member.guild.id,
          addBotMsg(member.id),
          logChannel,
          member.user.avatarURL() ?? ""
        )
        return
      }
      if (data.is_bot) {
        sendInviteTrackerMessage(
          member.guild.id,
          botInviteMsg(member.id),
          logChannel,
          member.user.avatarURL() ?? ""
        )
        return
      }
      if (data.is_vanity) {
        sendInviteTrackerMessage(
          member.guild.id,
          vantityInviteMsg(member.id),
          logChannel,
          member.user.avatarURL() ?? ""
        )
        return
      }
      if (!data.inviter_id) {
        sendInviteTrackerMessage(
          member.guild.id,
          unknowErrorMsg(member.id),
          logChannel,
          member.user.avatarURL() ?? ""
        )
        return
      }
      sendInviteTrackerMessage(
        member.guild.id,
        inviteMsg(member.id, data.inviter_id, data.invites_amount),
        logChannel,
        member.user.avatarURL() ?? ""
      )
      welcomeNewMember(member)
      sendDMToUser(member.guild.name, data.invitee_id)
    } catch (e) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e as string)
      }
      ChannelLogger.log(error, 'Event<"guildMemberAdd">')
    }
  },
} as Event<"guildMemberAdd">

function unknowErrorMsg(memberID: string) {
  return `I can not figure out how <@${memberID}> joined the server.`
}

function vantityInviteMsg(memberID: string) {
  return `<@${memberID}> joined using a vanity invite.`
}

function botInviteMsg(memberID: string) {
  return `<@${memberID}> joined using OAuth.`
}

function addBotMsg(memberID: string) {
  return `<@${memberID}> has been invited by admin.`
}

function inviteMsg(memberID: string, inviterID: string, inviteAmount: number) {
  return `<@${memberID}> has been invited by <@${inviterID}> and has now ${inviteAmount} invites.`
}

function sendInviteTrackerMessage(
  guildId: string,
  msg: string,
  logChannel?: Discord.Channel,
  thumbnail?: string
) {
  if (!logChannel || !logChannel.isText()) {
    // TODO(tuand): need to handle better e.g show warning to user
    logger.warn(`[guildMemberAdd/${guildId}] - log channel not set`)
    return
  }
  const embed = composeEmbedMessage(null, {
    title: "Invite Tracker",
    description: msg,
    thumbnail: thumbnail || DISCORD_DEFAULT_AVATAR,
  })
  logChannel.send({ embeds: [embed] })
}

async function setUserDefaultRoles(member: Discord.GuildMember) {
  const res = await config.getCurrentDefaultRole(member.guild.id)

  if (res.ok && res.data.role_id) {
    await member.roles.add(res.data.role_id)
  }
}

async function welcomeNewMember(member: Discord.GuildMember) {
  const welcomeChannel = await config.getCurrentWelcomeConfig(member.guild.id)
  if (!welcomeChannel.ok) return

  const configData = welcomeChannel.data
  if (
    !configData ||
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
  const chan = await client.channels.fetch(configData.channel_id)
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

  const embed = composeEmbedMessage(null, {
    title: "Welcome",
    description: configData.welcome_message.replaceAll(
      "$name",
      member.displayName
    ),
  })
  if (chan.isText()) {
    chan.send({ embeds: [embed] })
  }
}

async function sendDMToUser(guildName: string, inviteeID: string) {
  const res = await Profile.getUser({ discordId: inviteeID })

  if (!res.ok) return

  if (res.data.nr_of_join > 1) return

  client.users.fetch(inviteeID).then((user) => {
    user.createDM().then((dm) => {
      dm.send({
        embeds: [
          composeEmbedMessage(null, {
            title: `Welcome to the ${guildName} server installed Mochi Bot.`,
            description: `Type \`$help\` in ${guildName} server or read this Instruction on [Gitbook](https://app.gitbook.com/s/nJ8qX0cEj5ph125HugiB/~/changes/SoXaDd3kMCfyXNQDOZ9f/getting-started/permission-and-prefix) to get to know all our features. Now, let us walk you through some of Mochi Bot main functions:\n
              - **Crypto management:** Managing your crypto portfolio.
              - **NFT Rarity Ranking & Volume:** Tracking and managing your favorite NFT collections.
              - **Server Administration:** Building and managing your own community on Discord (For server owners only. Want to use these features? [Install Mochi Bot to your server now!](https://getmochi.co/))
              \nRemember to use our feature, you need to place \`$\` or \`/\` in every command. Now, back to ${guildName} server, start with $help, and try our features!!!`,
          }),
        ],
      })
    })
  })
}
