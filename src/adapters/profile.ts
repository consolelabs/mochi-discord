import fetch from "node-fetch"
import { User } from "types/profile"
import { API_BASE_URL } from "utils/constants"

class Profile {
  public async getUser({ discordId }: { discordId?: string }): Promise<User> {
    const resp = await fetch(`${API_BASE_URL}/users/${discordId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })
    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }
}

export default new Profile()
