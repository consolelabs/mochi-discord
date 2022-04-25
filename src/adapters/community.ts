import { logger } from "logger"
import fetch from "node-fetch"
import { InvitesInput } from "types/community"
import { API_BASE_URL } from "utils/constants"

class Community {  
  public async getInvites(input: InvitesInput): Promise<any> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/community/invites?guild_id=${input.guild_id}&member_id=${input.member_id}`
      )

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }
  
  public async getInvitesLeaderboard(guildId: string ): Promise<any> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/community/invites/leaderboard/${guildId}`
      )

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }
  
  public async configureInvites(body: string ): Promise<any> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/community/invites/config`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        },
      )

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }
}

export default new Community()
