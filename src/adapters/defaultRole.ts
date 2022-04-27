import { logger } from "logger"
import fetch from "node-fetch"
import { DefaultRoleEvent } from "types/common"
import { API_BASE_URL } from "utils/constants"

class DefaultRole {

  public async getAllDefaultRoles() {
    try {
      const res = await fetch(
        `${API_BASE_URL}/configs/default-roles`)

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async configureDefaultRole(event: DefaultRoleEvent) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/configs/default-roles?role_id=${event.role_id}&guild_id=${event.guild_id}`
      , {
        method: 'POST'
      })

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }
}

export default new DefaultRole()
