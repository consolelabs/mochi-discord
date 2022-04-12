import { logger } from "logger"
import fetch from "node-fetch"
import { API_SERVER_HOST } from "env"

class Invite {
  public async getInvitees(referralCode: string): Promise<string[]> {
    try {
      const res = await fetch(
        `${API_SERVER_HOST}/api/v1/invitees?referralCode=${referralCode}`
      )
      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }
}

export default new Invite()
