import { logger } from "logger"
import fetch from "node-fetch"
import { DefaultRoleEvent } from "types/common"
import { API_BASE_URL } from "utils/constants"

class DefaultRole {

  public async getAllDefaultRoles(guildId: string) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/configs/default-roles?guild_id=${guildId}`)

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async configureDefaultRole(event: DefaultRoleEvent) {
    try {
      const reqData = JSON.stringify(event)
      const res = await fetch(
        `${API_BASE_URL}/configs/default-roles`
      , {
        method: 'POST',
        body: reqData
      })

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }
}

export default new DefaultRole()
