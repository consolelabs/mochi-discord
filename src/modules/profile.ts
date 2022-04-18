import { API_SERVER_HOST, NEKO_SECRET, TATSU_API_KEY } from "env"
import { logger } from "logger"
import fetch from "node-fetch"
import NodeCache from "node-cache"
import { ethers } from "ethers"
import {
  ButtonInteraction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js"
import { BotBaseError } from "../errors"

export type User = {
  address: string
  discord_id: string
  referral_code: string
  is_verified: boolean
  number_of_tokens: number
  in_discord_wallet_number: number
  in_discord_wallet_address: string
  ens_record: string
  nom_record: string
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
            .setDescription(
              `\`\`\`${json.address}\`\`\`\nIf you want to change your address, [click here](https://pod.so/verify?code=${reverify.code}) to re-verify.`
            )
          await interaction.editReply({ embeds: [e1] })
          break
        case undefined:
          const e2 = new MessageEmbed()
            .setColor("#0099ff")
            .setTitle("Verify your identity")
            .setDescription(
              `Please verify your identity by clicking the button below.`
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
          throw new BotBaseError(json.error)
      }
    } catch (e: any) {
      await interaction.editReply("Something wrong")
      throw e
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

  public async getUserGMStreak(discordId: string, guildId: string) {
    const url = `${API_SERVER_HOST}/api/v1/user/gmstreak?discord_id=${discordId}&guild_id=${guildId}`

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
    const url = `${API_SERVER_HOST}/api/v1/user/gmstreak/new-gm?discord_id=${discordId}&guild_id=${guildId}&timestamp=${timestamp}`

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    return await resp.json()
  }
}

export default new Profile()
