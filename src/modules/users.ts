import { logger } from "logger"
import fetch from "node-fetch"
import { API_SERVER_HOST } from "env"

export interface UserInput {
  id: string
  username: string 
  guild_id: string
}

class User {
  public async indexUser(user: UserInput): Promise<any> {
    try {
      const body = JSON.stringify(user)
      const res = await fetch(
        `${API_SERVER_HOST}/api/v1/users`,
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
}

export default new User()
