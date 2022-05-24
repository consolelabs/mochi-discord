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

  public async getUserGmStreak(discordId: string, guildId: string) {
    const resp = await fetch(
      `${API_BASE_URL}/users/gmstreak?discord_id=${discordId}&guild_id=${guildId}`
    )
    return await resp.json()
  }

  public async generateVerificationCode(
    authorId: string,
    guildId: string,
    isReverify?: boolean
  ) {
    const resp = await fetch(`${API_BASE_URL}/verify/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_discord_id: authorId,
        guild_id: guildId,
        is_reverify: isReverify,
      }),
    })

    return await resp.json()
  }
}

export default new Profile()
