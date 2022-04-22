export interface InviteHistoryInput {
  guild_id: string
  inviter: string
  invitee: string
}

export interface InviteeCountInput {
  guild_id: string
  inviter: string
}
