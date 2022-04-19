import { logger } from "logger"
import fetch from "node-fetch"
import { User, UserInput } from "types/profile"
import { API_BASE_URL } from "utils/constants"

class Profile {
  public async getUser({ discordId }: { discordId?: string }): Promise<User> {
    const resp = await fetch(`${API_BASE_URL}/users/${discordId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async createUser(user: UserInput): Promise<any> {
    try {
      const body = JSON.stringify(user)
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        body: body,
      })

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }
}

export default new Profile()
