import { Message } from "discord.js"
import fetch from "node-fetch"
import { CampaignWhitelistUser } from "types/common"
import { InvitesInput } from "types/community"
import { API_BASE_URL } from "utils/constants"

class Community {
  public async getInvites(input: InvitesInput): Promise<any> {
    const res = await fetch(
      `${API_BASE_URL}/community/invites?guild_id=${input.guild_id}&member_id=${input.member_id}`
    )
    if (res.status !== 200) {
      throw new Error(`failed to get invitees - guild ${input.guild_id}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async getInvitesLeaderboard(guildId: string): Promise<any> {
    const res = await fetch(
      `${API_BASE_URL}/community/invites/leaderboard/${guildId}`
    )
    if (res.status !== 200) {
      throw new Error(`failed to get invites leaderboard - guild ${guildId}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async getCurrentInviteTrackerConfig(guildId: string) {
    const res = await fetch(
      `${API_BASE_URL}/community/invites/config?guild_id=${guildId}`
    )
    if (res.status !== 200) {
      throw new Error(
        `failed to get current invite tracker config - guild ${guildId}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async configureInvites(req: {
    guild_id: string
    log_channel: string
  }) {
    const res = await fetch(`${API_BASE_URL}/community/invites/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    })
    if (res.status !== 200) {
      throw new Error(`failed to configure invites - guild ${req.guild_id}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async getUserInvitesAggregation(guildId: string, inviterId: string) {
    const res = await fetch(
      `${API_BASE_URL}/community/invites/aggregation?guild_id=${guildId}&inviter_id=${inviterId}`
    )
    if (res.status !== 200) {
      throw new Error(
        `failed to get user invites aggregation - guild ${guildId}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async createWhitelistCampaign(campaignName: string, guildId: string) {
    const res = await fetch(`${API_BASE_URL}/whitelist-campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: campaignName,
        guild_id: guildId,
      }),
    })
    if (res.status !== 200) {
      throw new Error(`failed to create white list campaign - guild ${guildId}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async getAllRunningWhitelistCampaigns(guildId: string) {
    const res = await fetch(
      `${API_BASE_URL}/whitelist-campaigns?guild_id=${guildId}`
    )
    if (res.status !== 200) {
      throw new Error(`failed to create white list campaign - guild ${guildId}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async getWhitelistCampaignInfo(campaignId: number) {
    const res = await fetch(`${API_BASE_URL}/whitelist-campaigns/${campaignId}`)
    if (res.status !== 200) {
      throw new Error(
        `failed to get whitelist campaign info - campaign ${campaignId}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async getWhitelistWinnerInfo(discordId: string, campaignId: string) {
    const res = await fetch(
      `${API_BASE_URL}/whitelist-campaigns/users/${discordId}?campaign_id=${campaignId}`
    )
    if (res.status !== 200) {
      throw new Error(
        `failed to get whitelist winner - params ${{ discordId, campaignId }}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async addCampaignWhitelistUser(users: CampaignWhitelistUser[]) {
    const res = await fetch(`${API_BASE_URL}/whitelist-campaigns/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users }),
    })
    if (res.status !== 200) {
      throw new Error("failed to add campaign wl user")
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async getTopXPUsers(
    msg: Message,
    page: number,
    limit = 10
  ): Promise<any> {
    const resp = await fetch(
      `${API_BASE_URL}/users/top?guild_id=${msg.guildId}&user_id=${msg.author.id}&page=${page}&limit=${limit}`,
      {
        method: "GET",
      }
    )
    if (resp.status !== 200) {
      throw new Error(`failed to get top XP users - guild ${msg.guildId}`)
    }

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async createStatChannel(guildId: string, countType: string) {
    const res = await fetch(
      `${API_BASE_URL}/guilds/${guildId}/channels?count_type=${countType}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    )
    if (res.status !== 200) {
      throw new Error(`failed to create stat channel - guild ${guildId}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }
}

export default new Community()
