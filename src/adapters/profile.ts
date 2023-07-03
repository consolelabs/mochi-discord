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
import { capitalizeFirst, removeDuplications } from "utils/common"
import { logger } from "logger"
import { formatDigit } from "utils/defi"
import mochiTelegram from "./mochi-telegram"

class Profile extends Fetcher {
  public async getUserSocials(discordId: string) {
    const dataProfile = await this.getByDiscord(discordId)
    if (dataProfile.err) {
      logger.error("Cannot get profile by discord id", discordId)
      return []
    }

    const socials = await Promise.all(
      dataProfile.associated_accounts
        .filter((a: any) => ["twitter", "telegram"].includes(a.platform))
        .map(async (a: any) => {
          if (a.platform === "telegram") {
            const res = await mochiTelegram.getById(a.platform_identifier)
            if (!res.ok) return a

            return {
              ...a,
              platform_identifier: res.data.username,
            }
          }

          return a
        })
    )

    return socials
  }

  public async getUserWallets(discordId: string, noFetchAmount = false) {
    const dataProfile = await this.getByDiscord(discordId, noFetchAmount)
    if (dataProfile.err) {
      logger.error("Cannot get profile by discord id", discordId)
      return {
        onchainTotal: 0,
        cexTotal: 0,
        mochiWallets: [],
        wallets: [],
        cexes: [],
        pnl: 0,
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
      chain: String(m.chain?.is_evm ? "EVM" : m.chain?.symbol).toUpperCase(),
    }))

    let pnl = Number(dataProfile.pnl || 0)
    if (Number.isNaN(pnl)) {
      pnl = 0
    }

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

          let chain = w.platform.split("-").shift().toUpperCase()
          let value = w.platform_identifier
          switch (w.platform) {
            case "solana-chain":
              chain = "SOL"
              break
            case "ronin-chain":
              chain = "RON"
              if (value.startsWith("ronin:")) {
                value = value.slice(6)
              }
              break
            case "near-chain":
              value = value.slice(0, -5)
              break
            default:
              break
          }

          return {
            value,
            total: formatDigit({
              value: bal.toString(),
              fractionDigits: bal >= 100 ? 0 : 2,
            }),
            chain,
          }
        }) ?? []
    )

    let cexTotal = 0
    const cexes = removeDuplications(
      dataProfile.associated_accounts
        ?.filter((a: any) => ["binance"].includes(a.platform))
        .sort((a: any, b: any) => {
          return (b.total_amount || 0) - (a.total_amount || 0)
        })
        ?.map((w: any) => {
          const bal = Number(w.total_amount || 0)
          cexTotal += bal

          return {
            value: w.platform_metadata?.username || w.platform_identifier,
            chain: capitalizeFirst(w.platform),
            total: formatDigit({
              value: bal.toString(),
              fractionDigits: bal >= 100 ? 0 : 2,
            }),
          }
        }) ?? []
    )

    return {
      onchainTotal,
      cexTotal,
      mochiWallets,
      wallets,
      cexes,
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

  public async submitBinanceKeys(body: {
    discordUserId: string
    apiSecret: string
    apiKey: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/api-key/binance`, {
      method: "POST",
      body,
    })
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

  public async getById(id: string): Promise<any> {
    return await this.jsonFetch(`${MOCHI_PROFILE_API_BASE_URL}/profiles/${id}`)
  }

  public async getByDiscord(
    discordId: string,
    noFetchAmount = true
  ): Promise<any> {
    return await this.jsonFetch(
      `${MOCHI_PROFILE_API_BASE_URL}/profiles/get-by-discord/${discordId}${
        noFetchAmount ? "?no-fetch-amount=true" : ""
      }`
    )
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
    const {
      data: res,
      ok,
      pagination,
    } = await this.jsonFetch(
      `${MOCHI_PROFILE_API_BASE_URL}/profiles/${profileId}/activities?page=${page}&size=${size}`
    )
    let data = []
    if (ok) {
      data = res as any[]
    }

    return { data, pagination }
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

  public async disconnectOnChainWallet(
    profileId: string,
    platformIdentifier: string
  ) {
    return await this.jsonFetch(
      `${MOCHI_PROFILE_API_BASE_URL}/profiles/${profileId}/accounts/disconnect-wallet/${platformIdentifier}`,
      { method: "POST" }
    )
  }
}

export default new Profile()
