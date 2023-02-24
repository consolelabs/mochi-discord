import { ResponseGetDataUserProfileResponse } from "types/api"
import {
  GetUserNFTCollectionResponse,
  GetUserNFTsResponse,
} from "types/profile"
import { API_BASE_URL, INDEXER_API_BASE_URL } from "utils/constants"
import { Fetcher } from "./fetcher"

class Profile extends Fetcher {
  public async getUser({ discordId }: { discordId?: string }) {
    return await this.jsonFetch(`${API_BASE_URL}/users/${discordId}`)
  }

  public async getUserGmStreak(discordId: string, guildId: string) {
    return await this.jsonFetch(`${API_BASE_URL}/users/gmstreak`, {
      query: {
        discordId,
        guildId,
      },
    })
  }

  public async generateVerificationCode(body: {
    userDiscordId: string
    guildId: string
    isReverify?: boolean
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/verify/generate`, {
      method: "POST",
      body,
    })
  }

  public async getUserProfile(guildId: string, userId: string) {
    return await this.jsonFetch<ResponseGetDataUserProfileResponse>(
      `${API_BASE_URL}/users/profiles`,
      {
        query: {
          guildId,
          userId,
        },
      }
    )
  }

  public async getUserNFTCollection(params: {
    userAddress: string
    page?: number
    size?: number
  }) {
    const { userAddress, page = 0, size = 50 } = params
    return await this.jsonFetch<GetUserNFTCollectionResponse>(
      `${INDEXER_API_BASE_URL}/${userAddress}/collection`,
      {
        query: {
          page,
          size,
        },
      }
    )
  }

  public async getUserNFT(params: {
    userAddress: string
    collectionAddresses?: string[]
    page?: number
    size?: number
  }) {
    const { userAddress, collectionAddresses, page = 0, size = 50 } = params
    return await this.jsonFetch<GetUserNFTsResponse>(
      `${INDEXER_API_BASE_URL}/${userAddress}/nft`,
      {
        query: {
          page,
          size,
          collectionAddresses,
        },
      }
    )
  }

  public async getNftCollections(query: { address: string }) {
    return await this.jsonFetch<GetUserNFTsResponse>(
      `${INDEXER_API_BASE_URL}/nft`,
      { query }
    )
  }
}

export default new Profile()
