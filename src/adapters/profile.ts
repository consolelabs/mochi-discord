import { ResponseGetDataUserProfileResponse } from "types/api"
import {
  GetUserNFTCollectionResponse,
  GetUserNFTsResponse,
} from "types/profile"
import {
  API_BASE_URL,
  INDEXER_API_BASE_URL,
  MOCHI_PROFILE_API_BASE_URL,
} from "utils/constants"
import { Fetcher } from "./fetcher"
import fetch from "node-fetch"
import mochiPay from "./mochi-pay"
import { uniqBy } from "lodash"
import { removeDuplications } from "utils/common"
import { logger } from "logger"
import { formatDigit } from "utils/defi"
import CacheManager from "cache/node-cache"

CacheManager.init({
  pool: "profile-data",
  ttl: 300,
  checkperiod: 150,
})

class Profile extends Fetcher {
  public async getUserVaults(profileId: string, guildId: string | null) {
    return await this.jsonFetch(`${API_BASE_URL}/vault`, {
      query: {
        profileId,
        ...(guildId ? { guildId } : {}),
      },
    })
  }

  public async getUserSocials(discordId: string) {
    const dataProfile = await this.getByDiscord(discordId)
    if (dataProfile.err) {
      logger.error("Cannot get profile by discord id", discordId)
      return []
    }

    return removeDuplications(
      dataProfile.associated_accounts.filter((a: any) =>
        ["twitter", "telegram"].includes(a.platform)
      )
    )
  }

  public async getUserWallets(discordId: string) {
    const dataProfile = await this.getByDiscord(discordId)
    if (dataProfile.err) {
      logger.error("Cannot get profile by discord id", discordId)
      return {
        onchainTotal: 0,
        mochiWallets: [],
        wallets: [],
      }
    }

    const { data: mochiWalletsRes, ok: mochiWalletsResOk } =
      await mochiPay.getMochiWalletsByProfileId(dataProfile.id)
    let mochiWallets = []
    if (mochiWalletsResOk) {
      mochiWallets = mochiWalletsRes as any[]
    }

    mochiWallets = uniqBy(mochiWallets, (mw) => mw.wallet_address)
    mochiWallets = mochiWallets.map((m) => ({
      value: m.wallet_address,
      chain: m.chain?.is_evm ? "EVM" : m.chain?.symbol,
    }))

    const pnl = dataProfile.pnl ?? "0"

    let onchainTotal = 0
    const wallets = removeDuplications(
      dataProfile.associated_accounts
        ?.filter((a: any) =>
          [
            "evm-chain",
            "solana-chain",
            "near-chain",
            "sui-chain",
            "ronin-chain",
          ].includes(a.platform)
        )
        .sort((a: any, b: any) => {
          return (b.total_amount || 0) - (a.total_amount || 0)
        })
        ?.map((w: any) => {
          const bal = Number(w.total_amount || 0)
          onchainTotal += bal
          return {
            disabled: !["evm-chain", "solana-chain"].includes(w.platform),
            value: w.platform_identifier,
            total: formatDigit({
              value: bal.toString(),
              fractionDigits: 2,
            }),
            chain:
              w.platform === "solana-chain"
                ? "SOL"
                : w.platform.split("-").shift().toUpperCase(),
          }
        }) ?? []
    )

    return {
      onchainTotal,
      mochiWallets,
      wallets,
      pnl,
    }
  }

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

  public async getUserProfile(guildId: string | null = "", userId: string) {
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
    return await this.jsonFetch<GetUserNFTCollectionResponse>(
      `${INDEXER_API_BASE_URL}/nft`,
      { query }
    )
  }

  public async getById(id: string) {
    const res = await fetch(`${MOCHI_PROFILE_API_BASE_URL}/profiles/${id}`)
    return await res?.json()
  }

  public async getByDiscord(discordId: string) {
    return await CacheManager.get({
      pool: "profile-data",
      key: discordId,
      call: async () => {
        const res = await fetch(
          `${MOCHI_PROFILE_API_BASE_URL}/profiles/get-by-discord/${discordId}`
        )

        return await res?.json()
      },
    })
  }

  public async getByEmail(email: string) {
    const res = await fetch(
      `${MOCHI_PROFILE_API_BASE_URL}/profiles/get-by-email/${email}`
    )
    return await res?.json()
  }

  // TODO: sp twitter id
  public async getByTwitter(username: string) {
    const res = await fetch(
      `${MOCHI_PROFILE_API_BASE_URL}/profiles/get-by-twitter/${username}`
    )
    return await res?.json()
  }

  public async getByTelegram(telegramId: string) {
    const res = await fetch(
      `${MOCHI_PROFILE_API_BASE_URL}/profiles/get-by-telegram/${telegramId}`
    )
    return await res?.json()
  }

  public async getUserActivities(profileId: string, page = 0, size = 12) {
    return await this.jsonFetch(
      `${MOCHI_PROFILE_API_BASE_URL}/profiles/${profileId}/activities?page=${page}&size=${size}`
    )
  }
  public async markReadActivities(profileId: string, body: { ids: number[] }) {
    return await this.jsonFetch(
      `${MOCHI_PROFILE_API_BASE_URL}/profiles/${profileId}/activities`,
      {
        method: "PUT",
        body,
      }
    )
  }

  public async requestProfileCode(profileId: string) {
    return await this.jsonFetch(
      `${MOCHI_PROFILE_API_BASE_URL}/profiles/${profileId}/codes`,
      { method: "POST" }
    )
  }
}

export default new Profile()
