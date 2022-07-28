import { Message } from "discord.js"
import fetch from "node-fetch"
import { CampaignWhitelistUser } from "types/common"
import { InvitesInput } from "types/community"
import { NftCollectionTicker } from "types/nft"
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

  public async getTopNFTTradingVolume(): Promise<any> {
    const resp = await fetch(`${API_BASE_URL}/nfts/trading-volume`, {
      method: "GET",
    })
    if (resp.status !== 200) {
      throw new Error(`failed to get top NFTs`)
    }
    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
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

  public async getNFTDetail(collectionSymbol: string, tokenId: string) {
    const res = await fetch(
      `${API_BASE_URL}/nfts/${collectionSymbol}/${tokenId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    // Need to keep json.error for case handling
    const json = await res.json()
    if (res.status !== 200) {
      // exclude case where status code is 500 and it's 'not found' or 'insync'
      if (
        !(
          (json.error.includes("not found") ||
            json.error.includes("in sync")) &&
          res.status == 500
        )
      )
        throw new Error(
          `failed to get NFT detail - ${collectionSymbol} | ${tokenId}`
        )
    }

    return json
  }

  public async getNFTCollectionDetail(collectionSymbol: string) {
    const res = await fetch(
      `${API_BASE_URL}/nfts/collections/${collectionSymbol}/detail`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    if (res.status !== 200) {
      throw new Error(
        `failed to get NFT Collection detail - ${collectionSymbol}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async getNFTCollectionTickers({
    symbol,
    from,
    to,
  }: {
    symbol: string
    from: number
    to: number
  }): Promise<NftCollectionTicker> {
    const res = await fetch(
      `${API_BASE_URL}/nfts/collections/${symbol}/tickers?from=${from}&to=${to}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    if (res.status !== 200) {
      throw new Error(`failed to get NFT collection - ${symbol}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async createSalesTracker(
    addr: string,
    plat: string,
    guildId: string,
    channelId: string
  ) {
    const res = await fetch(`${API_BASE_URL}/nfts/sales-tracker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel_id: channelId,
        contract_address: addr,
        platform: plat,
        guild_id: guildId,
      }),
    })
    if (res.status !== 200) {
      throw new Error(`failed to create sales tracker`)
    }

    const json = await res.json()
    return json
  }

  public async getNFTCollections({
    page = 0,
    size = 10,
  }: {
    page?: number
    size?: number
  }) {
    const res = await fetch(
      `${API_BASE_URL}/nfts/collections?page=${page}&size=${size}`,
      {
        method: "GET",
      }
    )
    if (res.status !== 200) {
      throw new Error(
        `failed to get NFT collections page ${page} of ${size} items`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async getCurrentNFTCollections({
    page = 0,
    size = 10,
  }: {
    page?: number
    size?: number
  }) {
    const res = await fetch(
      `${API_BASE_URL}/nfts/new-listed?interval=7&page=${page}&size=${size}`,
      {
        method: "GET",
      }
    )
    if (res.status !== 200) {
      throw new Error(
        `failed to get NFT collections page ${page} of ${size} items`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async createVerifyWalletChannel(req: {
    guild_id: string
    verify_channel_id: string
  }) {
    const res = await fetch(`${API_BASE_URL}/verify/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    })
    if (res.status !== 201) {
      throw new Error(
        `failed to create verify wallet channel ${req.verify_channel_id}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
  }

  public async deleteVerifyWalletChannel(guild_id: string) {
    const res = await fetch(
      `${API_BASE_URL}/verify/config?guild_id=${guild_id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    if (res.status !== 200) {
      throw new Error(
        `failed to delete verify wallet channel from guild ${guild_id}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
  }

  public async getVerifyWalletChannel(guild_id: string) {
    const res = await fetch(`${API_BASE_URL}/verify/config/${guild_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    if (res.status !== 200 && res.status !== 400) {
      throw new Error(
        `failed to get verify wallet config from guild ${guild_id}`
      )
    }

    const json = await res.json()
    // throw all errors except 'record not found'
    if (json.error !== undefined && !json.error.includes("record not found")) {
      throw new Error(json.error)
    }
    return json
  }

  public async giftXp(req: {
    admin_discord_id: string
    user_discord_id: string
    guild_id: string
    channel_id: string
    xp_amount: number
  }) {
    const res = await fetch(`${API_BASE_URL}/gift/xp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    })
    if (res.status !== 200) {
      throw new Error(
        `failed to gift ${req.xp_amount} XP to user ${req.user_discord_id} from ${req.admin_discord_id}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
  }

  public async getNFTMetadataAttrIcon() {
    const res = await fetch(`${API_BASE_URL}/nfts/icons`, {
      method: "GET",
    })
    if (res.status !== 200) {
      throw new Error(`failed to get NFT icons`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }
  public async getCollectionCount() {
    const res = await fetch(`${API_BASE_URL}/nfts/collections/stats`, {
      method: "GET",
    })
    if (res.status !== 200) {
      throw new Error(`failed to get collection count`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }
}

export default new Community()
