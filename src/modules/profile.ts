import {
  API_SERVER_HOST,
  NEKO_SECRET,
  PROCESSOR_API_SERVER_HOST,
  TATSU_API_KEY,
} from "env"
import { logger } from "logger"
import fetch from "node-fetch"
import NodeCache from "node-cache"
import { ethers } from "ethers"
import dayjs from "dayjs"
import {
  ButtonInteraction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js"
import { NekoBotBaseError } from "../errors"

export type User = {
  address: string
  discord_id: string
  twitter_id: string
  twitter_handle: string
  twitter_name: string
  referral_code: string
  is_verified: boolean
  number_of_tokens: number
  in_discord_wallet_number: number
  in_discord_wallet_address: string
  current_rank: Role
  next_rank: Role
  xps: UserXps
  ens_record: string
  nom_record: string
  avatar: NFTToken
}

type NFTToken = {
  token_id?: number
  collection_address?: string
  name?: string
  description?: string
  amount?: number
  image?: string
  image_cdn?: string
  thumbnail_cdn?: string
  image_content_type?: string
  rarity_rank?: number
  rarity_score?: string
  metadata_id?: string
  is_show_marketplace: boolean
}

type UserXps = {
  nobility_xp: number
  fame_xp: number
  loyalty_xp: number
  reputation_xp: number
}

export type Role = {
  id: string
  name: string
  guild_id: string
  number_of_token: number
}

export type Balance = {
  token_address: string
  token_name: string
  balance: number
  pool_name: string
  balance_usd: number
}

export type UserBalance = {
  discord_id: string
  address: string
  total_balance: number
  total_balance_usd: number
  balances: Array<Balance>
}

export type UserPtTransaction = {
  action: string
  created_at: Date
  dapp: string
  fame_xp: number
  loyalty_xp: number
  nobility_xp: number
  reputation_xp: number
  user_discord_id: string
}

const profileCache = new NodeCache({
  stdTTL: 360,
  checkperiod: 400,
  useClones: false,
})

const provider = new ethers.providers.JsonRpcProvider("https://rpc.ftm.tools")

class Profile {
  public async getTatsuProfile(discordId: string) {
    const resp = await fetch(
      `https://api.tatsu.gg/v1/users/${discordId}/profile`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: TATSU_API_KEY,
        },
      }
    )
    if (resp.status !== 200) {
      throw new Error("Cannot get tatsu profile")
    }

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async getUser({
    address,
    discordId,
    guildId,
  }: {
    address?: string
    discordId?: string
    guildId?: string
  }): Promise<User> | null {
    try {
      let reqParam = address ? `address=${address}` : `discord_id=${discordId}`
      reqParam += guildId ? `&guild_id=${guildId}` : ""

      const resp = await fetch(
        `${API_SERVER_HOST}/api/v1/user/info?${reqParam}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${NEKO_SECRET}`,
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
          throw new Error(json.error)
      }
    } catch (e: any) {
      logger.error(e)
      return null
    }
  }

  public async getTotalBalance({
    address,
    discordId,
    guildId,
  }: {
    address?: string
    discordId?: string
    guildId?: string
  }): Promise<Array<UserBalance>> | null {
    try {
      let reqParam = address ? `address=${address}` : `discord_id=${discordId}`
      const resp = await fetch(
        `${API_SERVER_HOST}/api/v1/pod-together/user?${reqParam}&guild_id=${guildId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      )
      const json = await resp.json()

      switch (json.error) {
        case undefined:
          return json.data ? [...json.data] : null
        default:
          console.error(json.error)
          return null
      }
    } catch (e: any) {
      logger.error(e)
      return null
    }
  }

  public async sendVerifyURL(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true })
    try {
      const json = await this.generateVerification(
        interaction.member.user.id,
        interaction.guild.id
      )
      switch (json.error) {
        case "already have a pod identity":
          const reverify = await this.generateVerification(
            interaction.member.user.id,
            interaction.guild.id,
            true
          )
          const e1 = new MessageEmbed()
            .setColor("#0099ff")
            .setTitle("You already have a pod identity")
            .setDescription(`\`\`\`${json.address}\`\`\`\nIf you want to change your address, [click here](https://pod.so/verify?code=${reverify.code}) to re-verify.`)
          await interaction.editReply({ embeds: [e1] })
          break
        case undefined:
          const e2 = new MessageEmbed()
            .setColor("#0099ff")
            .setTitle("Verify your pod identity")
            .setDescription(
              `Please verify your pod identity by clicking the button below.`
            )
          const row = new MessageActionRow().addComponents(
            new MessageButton()
              .setLabel("Verify")
              .setStyle("LINK")
              .setURL(`https://pod.so/verify?code=${json.code}`)
          )
          await interaction.editReply({ embeds: [e2], components: [row] })
          break
        default:
          throw new NekoBotBaseError(json.error)
      }
    } catch (e: any) {
      await interaction.editReply("Something wrong")
      throw e
      return
    }
  }

  public async generateVerification(
    authorId: string,
    guildId: string,
    reverify?: boolean
  ) {
    let url = `${API_SERVER_HOST}/api/v1/verify/generate?discord_id=${authorId}&guild_id=${guildId}`
    if (reverify) url += "&reverify=true"
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    return await resp.json()
  }

  public async getUserPtTransactions(
    discordId: string
  ): Promise<UserPtTransaction[]> {
    const resp = await fetch(
      `${PROCESSOR_API_SERVER_HOST}/user_transactions?user_discord_id=${discordId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    if (resp.status !== 200) {
      throw new Error("Cannot get user transactions")
    }

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
      .map((d: UserPtTransaction) => ({
        ...d,
        timestamp: dayjs(d.created_at).unix(),
      }))
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
  }

  public async updateTwitterHandle(body: {
    discordId: string
    twitterHandle: string
    guildId?: string
    isAdminCommand?: boolean
  }) {
    const resp = await fetch(`${API_SERVER_HOST}/api/v1/user/set-twitter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    return await resp.json()
  }

  public async getUserGMStreak(discordId: string, guildId: string) {
    let url = `${API_SERVER_HOST}/api/v1/user/gmstreak?discord_id=${discordId}&guild_id=${guildId}`

    const resp = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    return await resp.json()
  }

  public async newUserGM(
    discordId: string,
    guildId: string,
    timestamp: number
  ) {
    let url = `${API_SERVER_HOST}/api/v1/user/gmstreak/new-gm?discord_id=${discordId}&guild_id=${guildId}&timestamp=${timestamp}`

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    return await resp.json()
  }
}

export default new Profile()
