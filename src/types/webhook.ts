import discrod from 'discord.js'

export interface GuildMember {
  guild_id: string
  joined_at: Date | null
  nick: string | null
  deaf: boolean | null
  mute: boolean | null
  user: discrod.User | null
  roles: string[] | null
  premium_since: Date | null
  pending: boolean | null
  permissions: string | null
  communication_disabled_until: Date | null
}

export function createBEGuildMember(member: discrod.GuildMember): GuildMember {
  member.user.banner = null
  member.user.accentColor = null

  return {
    guild_id: member.guild.id,
    joined_at: member.joinedAt ? new Date(member.joinedAt) : null,
    nick: member.nickname || null,
    deaf: member.voice.deaf || null,
    mute: member.voice.mute || null,
    user: member.user || null,
    roles: member.roles.cache.map((role) => role.id),
    premium_since: member.premiumSinceTimestamp
      ? new Date(member.premiumSinceTimestamp)
      : null,
    pending: member.pending || null,
    permissions: member.permissions.bitfield.toString() || null,
    communication_disabled_until: null,
  }
}
