import { API_SERVER_HOST } from "env"
import { logger } from "logger"
import fetch from "node-fetch"
import {
  ButtonInteraction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js"
import { BotBaseError } from "../errors"
import { User, UserInput } from "types/profile"

class Profile {
  public async getUser({
    discordId,
  }: {
    discordId?: string
  }): Promise<User> | null {
    try {
      const resp = await fetch(
        `${API_SERVER_HOST}/api/v1/user?discord_id=${discordId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
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

  public async indexUser(user: UserInput): Promise<any> {
    try {
      const body = JSON.stringify(user)
      const res = await fetch(
        `${API_SERVER_HOST}/api/v1/users`,
        {
          method: "POST",
          body: body,
        }
      )
      
      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }
}

export default new Profile()
