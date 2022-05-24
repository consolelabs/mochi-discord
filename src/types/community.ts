export type InviteHistoryInput = {
  guild_id: string
  inviter: string
  invitee: string
}

export type InviteeCountInput = {
  guild_id: string
  inviter: string
}

export type InvitesInput = {
  guild_id: string
  member_id: string
}
