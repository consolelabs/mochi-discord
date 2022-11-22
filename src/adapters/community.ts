import {
  ResponseGetNFTActivityResponse,
  ResponseGetUserCurrentGMStreakResponse,
  ResponseGetUserUpvoteLeaderboardResponse,
  ResponseIndexerNFTCollectionTickersResponse,
  ResponseNftMetadataAttrIconResponse,
  ResponseGetSuggestionNFTCollectionsResponse,
  ResponseGetNFTCollectionByAddressChainResponse,
  ResponseIndexerGetNFTTokenTickersResponse,
  ResponseClaimQuestsRewardsResponse,
  RequestCreateTradeOfferRequest,
  ResponseCreateTradeOfferResponse,
  ResponseGetTradeOfferResponse,
  ResponseUpdateUserFeedbackResponse,
  ResponseUserFeedbackResponse,
  RequestUserFeedbackRequest,
} from "types/api"
import { InvitesInput, NFTCollection, NFTDetail } from "types/community"
import { API_BASE_URL } from "utils/constants"
import { Fetcher } from "./fetcher"

class Community extends Fetcher {
  public async getInvites({ guild_id, member_id }: InvitesInput) {
    return await this.jsonFetch(`${API_BASE_URL}/community/invites`, {
      query: {
        guild_id,
        member_id,
      },
    })
  }

  public async getInvitesLeaderboard(guildId: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/community/invites/leaderboard/${guildId}`
    )
  }

  public async getCurrentInviteTrackerConfig(guildId: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/community/invites/config?guild_id=${guildId}`,
      {
        query: {
          guildId,
        },
      }
    )
  }

  public async configureInvites(req: {
    guild_id: string
    log_channel: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/community/invites/config`, {
      method: "POST",
      body: JSON.stringify(req),
    })
  }

  public async getUserInvitesAggregation(guildId: string, inviterId: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/community/invites/aggregation`,
      {
        query: {
          guildId,
          inviterId,
        },
      }
    )
  }

  public async getTopXPUsers(
    guildId: string,
    userId: string,
    page: number,
    limit = 10
  ) {
    return this.jsonFetch(`${API_BASE_URL}/users/top`, {
      query: {
        guildId,
        userId,
        page,
        limit,
      },
    })
  }

  public async getTopNFTTradingVolume() {
    return await this.jsonFetch(`${API_BASE_URL}/nfts/trading-volume`)
  }

  public async createStatChannel(guildId: string, countType: string) {
    return this.jsonFetch(`${API_BASE_URL}/guilds/${guildId}/channels`, {
      method: "POST",
      query: {
        countType,
      },
    })
  }

  public async getNFTDetail(
    collectionSymbol: string,
    tokenId: string,
    guildId: string
  ) {
    return await this.jsonFetch<NFTDetail>(
      `${API_BASE_URL}/nfts/${collectionSymbol}/${tokenId}`,
      {
        query: {
          guildId,
        },
      }
    )
  }

  public async getNFTActivity(params: {
    collectionAddress: string
    tokenId: string
    page?: number
    size?: number
  }) {
    const { collectionAddress, tokenId, page = 0, size = 5 } = params
    return await this.jsonFetch<ResponseGetNFTActivityResponse>(
      `${API_BASE_URL}/nfts/${collectionAddress}/${tokenId}/activity`,
      {
        query: { page, size },
      }
    )
  }

  public async getNFTCollectionDetail(collectionAddress: string) {
    return await this.jsonFetch<{ data: NFTCollection }>(
      `${API_BASE_URL}/nfts/collections/${collectionAddress}/detail`
    )
  }

  public async getNFTCollectionTickers({
    collectionAddress,
    from,
    to,
  }: {
    collectionAddress: string
    from: number
    to: number
  }) {
    return await this.jsonFetch<ResponseIndexerNFTCollectionTickersResponse>(
      `${API_BASE_URL}/nfts/collections/tickers`,
      {
        query: {
          collectionAddress,
          from,
          to,
        },
      }
    )
  }

  public async getNFTCollectionSuggestions(query: string) {
    return await this.jsonFetch<ResponseGetSuggestionNFTCollectionsResponse>(
      `${API_BASE_URL}/nfts/collections/suggestion`,
      {
        query: {
          query,
        },
      }
    )
  }

  public async getSalesTrackers(guildId: string) {
    return await this.jsonFetch(`${API_BASE_URL}/nfts/sales-tracker`, {
      query: { guildId },
    })
  }

  public async deleteSaleTracker(guildId: string, contractAddress: string) {
    return await this.jsonFetch(`${API_BASE_URL}/nfts/sales-tracker`, {
      method: "DELETE",
      query: { guildId, contractAddress },
    })
  }

  public async createSalesTracker(
    addr: string,
    plat: string,
    guildId: string,
    channelId: string
  ) {
    return await this.jsonFetch(`${API_BASE_URL}/nfts/sales-tracker`, {
      method: "POST",
      body: JSON.stringify({
        channel_id: channelId,
        contract_address: addr,
        platform: plat,
        guild_id: guildId,
      }),
    })
  }

  public async getNFTCollections({
    page = 0,
    size = 10,
  }: {
    page?: number
    size?: number
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/nfts/collections`, {
      query: {
        page,
        size,
      },
    })
  }

  public async getCurrentNFTCollections({
    page = 0,
    size = 10,
  }: {
    page?: number
    size?: number
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/nfts/new-listed`, {
      query: {
        interval: 7,
        page,
        size,
      },
    })
  }

  public async getNFTCollectionMetadata(address: string, chain: string) {
    return await this.jsonFetch<ResponseGetNFTCollectionByAddressChainResponse>(
      `${API_BASE_URL}/nfts/collections/address/${address}`,
      {
        query: {
          chain,
        },
      }
    )
  }

  public async createVerifyWalletChannel(req: {
    guild_id: string
    verify_channel_id: string
    verify_role_id?: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/verify/config`, {
      method: "POST",
      body: req,
    })
  }

  public async deleteVerifyWalletChannel(guild_id: string) {
    return await this.jsonFetch(`${API_BASE_URL}/verify/config`, {
      method: "DELETE",
      query: { guild_id },
    })
  }

  public async getVerifyWalletChannel(guild_id: string) {
    return await this.jsonFetch(`${API_BASE_URL}/verify/config/${guild_id}`)
  }

  public async getNFTMetadataAttrIcon() {
    return await this.jsonFetch<ResponseNftMetadataAttrIconResponse>(
      `${API_BASE_URL}/nfts/icons`
    )
  }

  public async getCollectionCount() {
    return await this.jsonFetch(`${API_BASE_URL}/nfts/collections/stats`)
  }

  public async getUpvoteStreak(discordId: string) {
    return await this.jsonFetch<ResponseGetUserCurrentGMStreakResponse>(
      `${API_BASE_URL}/users/upvote-streak`,
      {
        query: { discordId },
      }
    )
  }

  public async getVoteLeaderboard(
    guildId: string,
    by: "streak" | "total" = "total"
  ) {
    return await this.jsonFetch<ResponseGetUserUpvoteLeaderboardResponse>(
      `${API_BASE_URL}/users/upvote-leaderboard`,
      {
        query: {
          guildId,
          by,
        },
      }
    )
  }

  public async setUpvoteMessageCache(req: {
    user_id: string
    guild_id: string
    channel_id: string
    message_id: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/cache/upvote`, {
      method: "POST",
      body: JSON.stringify(req),
    })
  }

  public async getNFTTickers({
    collectionAddress,
    tokenId,
    from,
    to,
  }: {
    collectionAddress: string
    tokenId: string
    from: number
    to: number
  }) {
    return await this.jsonFetch<ResponseIndexerGetNFTTokenTickersResponse>(
      `${API_BASE_URL}/nfts/tickers`,
      {
        query: {
          collectionAddress,
          tokenId,
          from,
          to,
        },
      }
    )
  }

  public async getListQuest(user_id: string) {
    return await this.jsonFetch(`${API_BASE_URL}/quests`, {
      query: {
        user_id,
      },
    })
  }

  public async updateQuestProgress(body: {
    userId: string
    action: string
    guildId?: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/quests/progress`, {
      method: "POST",
      body,
    })
  }

  public async claimAllReward(user_id: string, routine = "daily") {
    return await this.jsonFetch<ResponseClaimQuestsRewardsResponse>(
      `${API_BASE_URL}/quests/claim`,
      {
        method: "POST",
        body: {
          routine,
          user_id,
        },
      }
    )
  }

  public async sendFeedback(req: RequestUserFeedbackRequest) {
    return await this.jsonFetch(`${API_BASE_URL}/feedback`, {
      method: "POST",
      body: req,
    })
  }

  public async updateFeedback(id: string, status: "confirmed" | "completed") {
    return await this.jsonFetch<ResponseUpdateUserFeedbackResponse>(
      `${API_BASE_URL}/feedback`,
      {
        method: "PUT",
        body: {
          id,
          status,
        },
      }
    )
  }

  public async getFeedbackList(discordId?: string, page = 0) {
    return await this.jsonFetch<{ data: ResponseUserFeedbackResponse }>(
      `${API_BASE_URL}/feedback`,
      {
        query: {
          discordId,
          page,
        },
      }
    )
  }

  public async createTradeOffer(body: RequestCreateTradeOfferRequest) {
    return await this.jsonFetch<ResponseCreateTradeOfferResponse>(
      `${API_BASE_URL}/trades`,
      {
        method: "POST",
        body,
      }
    )
  }

  public async getTradeOffer(id: string) {
    return await this.jsonFetch<ResponseGetTradeOfferResponse>(
      `${API_BASE_URL}/trades/${id}`
    )
  }
}

export default new Community()
