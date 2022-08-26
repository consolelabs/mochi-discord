import { PT_API_SERVER_HOST } from "env"
import fetch from "node-fetch"
import {
  PodTownUser,
  User,
  UserProfile,
  GetUserNFTResponse,
  GetUserNFTCollectionResponse,
  NFTMetadataAttrIcon,
  UserNFT,
} from "types/profile"
import { API_BASE_URL, INDEXER_API_BASE_URL } from "utils/constants"

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

  public async getPodTownUser(discordId: string): Promise<PodTownUser | null> {
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

  public async getUserNFTCollection(params: {
    userAddress: string
    page?: number
    size?: number
  }): Promise<GetUserNFTCollectionResponse> {
    const { userAddress, page = 0, size = 50 } = params
    const res = await fetch(
      `${INDEXER_API_BASE_URL}/${userAddress}/collection?page=${page}&size=${size}`,
      {
        method: "GET",
      }
    )
    if (res.status !== 200) {
      throw new Error(
        `failed to get collections of user address ${userAddress} `
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async getUserNFT(params: {
    userAddress: string
    collectionAddress?: string
    page?: number
    size?: number
  }): Promise<GetUserNFTResponse> {
    const { userAddress, collectionAddress, page = 0, size = 50 } = params
    let url = `${INDEXER_API_BASE_URL}/${userAddress}/nft?page=${page}&size=${size}`
    if (collectionAddress) {
      url = `${url}&collection_addresses=${collectionAddress}`
    }
    const res = await fetch(url, {
      method: "GET",
    })
    if (res.status !== 200) {
      throw new Error(`failed to get nfts of user address ${userAddress} `)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async getNFTDetails(params: {
    collectionAddress: string
    tokenId: string
  }): Promise<UserNFT> {
    const { collectionAddress, tokenId } = params
    const url = `${INDEXER_API_BASE_URL}/nft/${collectionAddress}/${tokenId}`
    const res = await fetch(url, {
      method: "GET",
    })
    if (res.status !== 200) {
      throw new Error(
        `failed to get nft details, address: ${collectionAddress}, id: ${tokenId} `
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async getNFTMetadataAttrIcon(): Promise<[NFTMetadataAttrIcon]> {
    const res = await fetch(
      `${INDEXER_API_BASE_URL}/nft/metadata/attributes-icon`,
      {
        method: "GET",
      }
    )
    if (res.status !== 200) {
      throw new Error(`failed to get NFT icons`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }
}

export default new Profile()
