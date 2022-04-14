import { logger } from "logger"
import fetch from "node-fetch"
import { API_SERVER_HOST } from "env"

export interface InviteHistoryInput {
  guild_id: string
  inviter: string
  invitee: string
}

export interface InviteeCountInput {
  guild_id: string
  inviter: string
}

class InviteHistory {
  public async indexInviteHistory(invite: InviteHistoryInput): Promise<any> {
    try {
      const body = JSON.stringify(invite)
      const res = await fetch(
        `${API_SERVER_HOST}/api/v1/invite-histories`,
        {
          method: "POST",
          body: body,
        }
        
      )

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }
  
  public async getInvitees(input: InviteeCountInput): Promise<any> {
    try {
      const res = await fetch(
        `${API_SERVER_HOST}/api/v1/invite-histories/count?guild_id=${input.guild_id}&inviter=${input.inviter}`
      )
      
      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }
}

export default new InviteHistory()
