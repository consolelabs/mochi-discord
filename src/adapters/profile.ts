import { PT_API_SERVER_HOST } from "env"
import fetch from "node-fetch"
import { PodTownUser, User, UserProfile } from "types/profile"
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

  public async getUserProfile(
    guildId: string,
    userId: string
  ): Promise<UserProfile> {
    const res = await fetch(
      `${API_BASE_URL}/profiles?guild_id=${guildId}&user_id=${userId}`,
      {
        method: "GET",
      }
    )
    if (res.status !== 200) {
      throw new Error(
        `failed to get profile of user ${userId} - guild ${guildId}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async getPodTownUser(discordId: string): Promise<PodTownUser> | null {
    const resp = await fetch(
      `${PT_API_SERVER_HOST}/api/v1/user/info?discord_id=${discordId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${NEKO_SECRET}`,
        },
      }
    )
    const json = await resp.json()
    switch (json.error) {
      case "unverified user":
        return {
          ...json.user,
          is_verified: false,
        }
      case undefined:
        return {
          ...json.user,
          is_verified: true,
        }
      default:
        return null
    }
  }
}

export default new Profile()
