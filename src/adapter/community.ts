import { logger } from "logger"
import fetch from "node-fetch"
import { InviteeCountInput, InviteHistoryInput } from "types/community"
import { API_BASE_URL } from "utils/constants"

class Community {
  public async createInviteHistory(invite: InviteHistoryInput): Promise<any> {
    try {
      const body = JSON.stringify(invite)
      const res = await fetch(`${API_BASE_URL}/invite-histories`, {
        method: "POST",
        body: body,
      })

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async getInvitees(input: InviteeCountInput): Promise<any> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/invite-histories/count?guild_id=${input.guild_id}&inviter=${input.inviter}`
      )

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }
}

export default new Community()
