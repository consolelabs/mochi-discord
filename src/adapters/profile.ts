import fetch from "node-fetch"
import { User } from "types/profile"
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

  public async getUserGmStreak(
    discordId: string,
    guildId: string
  ): Promise<any> {
    const resp = await fetch(
      `${API_BASE_URL}/users/gmstreak?discord_id=${discordId}&guild_id=${guildId}`
    )
    return await resp.json()
  }
}

export default new Profile()
