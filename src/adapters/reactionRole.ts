import { logger } from "logger"
import fetch from "node-fetch"
import { RoleReactionEvent } from "types/common"
import { API_BASE_URL } from "utils/constants"

class ReactionRole {

  public async handleReactionEvent(event: RoleReactionEvent) {
    try {
      const body = JSON.stringify(event)
      const res = await fetch(
        `${API_BASE_URL}/configs/reaction-roles`
      , {
        method: 'POST',
        body: body
      })

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async updateReactionConfig(req: RoleReactionEvent) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/configs/reaction-roles/update-config`, {
          method: 'POST',
          body: JSON.stringify(req)
        })
      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }
}

export default new ReactionRole()
