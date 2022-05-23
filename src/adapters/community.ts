import { Message } from "discord.js"
import { BotBaseError } from "errors"
import { logger } from "logger"
import fetch from "node-fetch"
import { json } from "stream/consumers"
import { CampaignWhitelistUser } from "types/common"
import { InvitesInput } from "types/community"
import { API_BASE_URL } from "utils/constants"

class Community {
  public async getInvites(input: InvitesInput): Promise<any> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/community/invites?guild_id=${input.guild_id}&member_id=${input.member_id}`
      )

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async getInvitesLeaderboard(guildId: string): Promise<any> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/community/invites/leaderboard/${guildId}`
      )

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async getCurrentInviteTrackerConfig(guildId: string) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/community/invites/config?guild_id=${guildId}`
      )

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async configureInvites(body: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/community/invites/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      })

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async getUserInvitesAggregation(
    guildId: string,
    inviterId: string
  ): Promise<any> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/community/invites/aggregation?guild_id=${guildId}&inviter_id=${inviterId}`
      )

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async createWhitelistCampaign(campaignName: string, guildId: string): Promise<any> {
    try {
      const body = {
        name: campaignName,
        guild_id: guildId
      }
      const res = await fetch(
        `${API_BASE_URL}/whitelist-campaigns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      )
  
      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async getAllRunningWhitelistCampaigns(guildId: string): Promise<any> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/whitelist-campaigns?guild_id=${guildId}`
      )

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async getWhitelistCampaignInfo(campaignId: number): Promise<any> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/whitelist-campaigns/${campaignId}`
      )

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async getWhitelistWinnerInfo(discordId: string, campaignId: string): Promise<any> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/whitelist-campaigns/users/${discordId}?campaign_id=${campaignId}`
      )

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async addCampaignWhitelistUser(users: CampaignWhitelistUser[]): Promise<any> {
    const body = {
      users
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/whitelist-campaigns/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      )
  
      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async getTopXPUsers(msg: Message, page: number): Promise<any> {
    const resp = await fetch(
      `${API_BASE_URL}/users/top?guild_id=${msg.guildId}&user_id=${msg.author.id}&page=${page}`,
      {
        method: "GET"
      }
    )
    if (resp.status !== 200) {
      throw new BotBaseError(msg)
    }

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }
}

export default new Community()
