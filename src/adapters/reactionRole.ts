import { logger } from "logger"
import fetch from "node-fetch"
import { API_BASE_URL } from "utils/constants"

class ReactionRole {
  public async getAllReactionConfigs(guildId: string): Promise<any> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/configs/reaction_roles?guild_id=${guildId}`
      )

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }
}

export default new ReactionRole()
