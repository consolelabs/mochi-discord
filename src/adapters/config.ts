import {
  Command,
  DefaultRoleEvent,
  RepostReactionRequest,
  RoleReactionEvent,
} from "types/common"
import { Message } from "discord.js"
import { CommandIsNotScopedError } from "errors"
import fetch from "node-fetch"
import { logger } from "../logger"
import { Guild, Guilds } from "types/config"
import { API_BASE_URL } from "utils/constants"
import { Token } from "types/defi"
import { Fetcher } from "./fetcher"

class Config extends Fetcher {
  public Guilds: Guilds

  public async initialize() {
    this.Guilds = await this.getGuilds()
    setInterval(async () => {
      this.Guilds = await this.getGuilds()
      logger.info(
        `reloaded ${this.Guilds.data.length} guild configs: ${this.Guilds.data
          .map((g) => g.name)
          .join(", ")}`
      )
    }, 3600000)
  }

  public async getGuilds(): Promise<Guilds> {
    const res = await fetch(`${API_BASE_URL}/guilds`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    if (res.status !== 200) {
      throw new Error(`failed to get all guilds`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }

    return json
  }

  public async getGuild(guildId: string): Promise<Guild> {
    const res = await fetch(`${API_BASE_URL}/guilds/` + guildId, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    switch (res.status) {
      case 200:
        return await res.json()
      case 404:
        return null
      default:
        throw new Error(`Unexpected status code: ${res.status}`)
    }
  }

  public async getGuildScopes(guildId: string): Promise<string[]> {
    const guild = await this.getGuild(guildId)
    return guild?.bot_scopes
  }

  public async commandIsScoped(
    msg: Message,
    category: string,
    command: string
  ): Promise<boolean> {
    if (msg.channel.type === "DM") return true

    const scopes = await this.getGuildScopes(msg.guildId)
    if (!scopes) return false
    const cat = category.toLowerCase()
    const cmd = command.toLowerCase()

    for (const scope of scopes) {
      const scopeParts = scope.split("/")
      switch (scopeParts.length) {
        case 0:
          logger.error("Invalid scope: " + scope)
          return false
        case 1:
          if (scopeParts[0] === "*") {
            return true
          }
          logger.error("Invalid scope: " + scope)
          break
        case 2: {
          const scopeCat = scopeParts[0]
          const scopeCmd = scopeParts[1]
          if (cat === scopeCat && (scopeCmd === "*" || cmd === scopeCmd)) {
            return true
          }
          break
        }
        default:
      }
    }
    return false
  }

  public async checkGuildCommandScopes(
    message: Message,
    commandObject: Command
  ) {
    if (commandObject.id === "help" || message.channel.type === "DM") return
    const isInScoped = await this.commandIsScoped(
      message,
      commandObject.category,
      commandObject.command
    )
    if (!isInScoped) {
      throw new CommandIsNotScopedError({
        message,
        category: commandObject.category.toLowerCase(),
        command: commandObject.command.toLowerCase(),
      })
    }
  }

  public async categoryIsScoped(
    msg: Message,
    category: string
  ): Promise<boolean> {
    if (msg.channel.type === "DM") return true

    const scopes = await this.getGuildScopes(msg.guildId)
    const cat = category.toLowerCase()

    for (const scope of scopes) {
      const scopeParts = scope.split("/")
      switch (scopeParts.length) {
        case 0:
          logger.error("Invalid scope: " + scope)
          return false
        case 1:
          if (scopeParts[0] === "*") {
            return true
          }
          logger.error("Invalid scope: " + scope)
          break
        case 2: {
          const scopeCat = scopeParts[0]
          if (cat === scopeCat) {
            return true
          }
          break
        }
        default:
      }
    }
    return false
  }

  public async createGuild(guildId: string, name: string) {
    const newGuild = {
      id: guildId,
      name: name,
    }

    await (
      await fetch(`${API_BASE_URL}/guilds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newGuild),
      })
    ).json()
  }

  public async getCurrentGmConfig(guildId: string) {
    const res = await fetch(`${API_BASE_URL}/configs/gm?guild_id=${guildId}`)
    if (res.status !== 200) {
      throw new Error(`failed to get current GM config - guild ${guildId}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async updateGmConfig(guild_id: string, channel_id: string) {
    const res = await fetch(`${API_BASE_URL}/configs/gm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guild_id,
        channel_id,
      }),
    })
    if (res.status !== 200) {
      throw new Error("failed to config GM channel")
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
  }
  public async getCurrentSalesConfig(guildId: string) {
    const res = await fetch(
      `${API_BASE_URL}/configs/sales-tracker?guild_id=${guildId}`
    )
    if (res.status !== 200) {
      throw new Error(`failed to get current GM config - guild ${guildId}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }
  public async updateSalesConfig(guild_id: string, channel_id: string) {
    const res = await fetch(`${API_BASE_URL}/configs/sales-tracker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guild_id,
        channel_id,
      }),
    })
    if (res.status !== 200) {
      throw new Error("failed to config GM channel")
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
  }

  public async getCurrentDefaultRole(guildId: string) {
    const res = await fetch(
      `${API_BASE_URL}/configs/default-roles?guild_id=${guildId}`
    )
    if (res.status !== 200) {
      logger.error(`failed to get current default role - guild ${guildId}`)
      return null
    } else {
      const json = await res.json()
      if (json.error !== undefined) {
        throw new Error(json.error)
      }
      return json
    }
  }

  public async configureDefaultRole(event: DefaultRoleEvent) {
    const res = await fetch(`${API_BASE_URL}/configs/default-roles`, {
      method: "POST",
      body: JSON.stringify(event),
    })
    if (res.status !== 200) {
      throw new Error(
        `failed to configure default role - guild ${event.guild_id}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async removeDefaultRoleConfig(guildId: string) {
    const res = await fetch(
      `${API_BASE_URL}/configs/default-roles?guild_id=${guildId}`,
      {
        method: "DELETE",
      }
    )
    if (res.status !== 200) {
      throw new Error(`failed to remove default role config - guild ${guildId}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async listAllReactionRoles(guildId: string) {
    const res = await fetch(
      `${API_BASE_URL}/configs/reaction-roles?guild_id=${guildId}`
    )
    if (res.status !== 200) {
      throw new Error(`failed to list reaction roles - guild ${guildId}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async handleReactionEvent(event: RoleReactionEvent) {
    const res = await fetch(`${API_BASE_URL}/configs/reaction-roles/filter`, {
      method: "POST",
      body: JSON.stringify(event),
    })
    if (res.status !== 200) {
      throw new Error(
        `failed to handle reaction event - guild ${event.guild_id}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async updateReactionConfig(req: RoleReactionEvent) {
    const res = await fetch(`${API_BASE_URL}/configs/reaction-roles`, {
      method: "POST",
      body: JSON.stringify(req),
    })
    if (res.status !== 200) {
      throw new Error(
        `failed to update reaction config - guild ${req.guild_id}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async removeReactionConfig(req: RoleReactionEvent) {
    const res = await fetch(`${API_BASE_URL}/configs/reaction-roles`, {
      method: "DELETE",
      body: JSON.stringify(req),
    })
    if (res.status !== 200) {
      throw new Error(
        `failed to remove reaction config - guild ${req.guild_id}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async getGuildTokens(guildId: string): Promise<Token[]> {
    const res = await fetch(
      `${API_BASE_URL}/configs/tokens?guild_id=${guildId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    )
    if (res.status !== 200) {
      throw new Error("failed to get guild tokens")
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async updateTokenConfig({
    guild_id,
    symbol,
    active,
  }: {
    guild_id: string
    symbol: string
    active: boolean
  }) {
    const res = await fetch(`${API_BASE_URL}/configs/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guild_id,
        symbol,
        active,
      }),
    })
    if (res.status !== 200) {
      throw new Error(`failed to update token config - guild ${guild_id}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
  }

  public async addToken(body: {
    guild_id: string
    symbol: string
    address: string
    chain: string
  }) {
    const resp = await fetch(`${API_BASE_URL}/configs/custom-tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    if (resp.status !== 200) {
      throw new Error(`failed to add new token ${body.symbol}`)
    }
    return json
  }

  public async configLevelRole(
    msg: Message,
    body: { guild_id: string; role_id: string; level: number }
  ) {
    const res = await fetch(`${API_BASE_URL}/configs/level-roles`, {
      method: "POST",
      body: JSON.stringify(body),
    })
    if (res.status !== 200) {
      throw new Error(`failed to config level role - guild ${body.guild_id}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
  }

  public async getGuildLevelRoleConfigs(msg: Message, guildId: string) {
    const res = await fetch(`${API_BASE_URL}/configs/level-roles/${guildId}`, {
      method: "GET",
    })
    if (res.status !== 200) {
      throw new Error(`failed to get levelroles configs - guild ${guildId}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async removeGuildLevelRoleConfig(guildId: string, level: number) {
    const res = await fetch(
      `${API_BASE_URL}/configs/level-roles/${guildId}?level=${level}`,
      {
        method: "DELETE",
      }
    )
    if (res.status !== 200) {
      throw new Error(`failed to remove levelrole config - guild ${guildId}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async updateGuild({
    guildId,
    globalXP,
    logChannel,
  }: {
    guildId: string
    globalXP?: string
    logChannel?: string
  }) {
    const res = await fetch(`${API_BASE_URL}/guilds/${guildId}`, {
      method: "PUT",
      body: JSON.stringify({
        global_xp: globalXP ?? "",
        log_channel: logChannel ?? "",
      }),
    })
    if (res.status !== 200) {
      throw new Error(`failed to toggle guild global XP - guild ${guildId}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
  }

  public async newGuildNFTRoleConfig(body: {
    guild_id: string
    role_id: string
    nft_collection_id: string
    number_of_tokens: number
    token_id: string | null
  }) {
    const res = await fetch(`${API_BASE_URL}/configs/nft-roles`, {
      method: "POST",
      body: JSON.stringify(body),
    })
    if (res.status !== 201) {
      throw new Error(`failed to config nft role - guild ${body.guild_id}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
  }

  public async getGuildNFTRoleConfigs(guildId: string) {
    const res = await fetch(
      `${API_BASE_URL}/configs/nft-roles/?guild_id=${guildId}`,
      {
        method: "GET",
      }
    )
    if (res.status !== 200) {
      throw new Error(`failed to get nftroles configs - guild ${guildId}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async removeGuildNFTRoleConfig(roleId: string) {
    const res = await fetch(`${API_BASE_URL}/configs/nft-roles/${roleId}`, {
      method: "DELETE",
    })
    if (res.status !== 200) {
      throw new Error(`failed to remove nftrole config - role ${roleId}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async getAllNFTCollections() {
    const res = await fetch(`${API_BASE_URL}/nfts`, {
      method: "GET",
    })
    if (res.status !== 200) {
      throw new Error(`failed to get nft collections`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async updateRepostReactionConfig(req: RepostReactionRequest) {
    const res = await fetch(`${API_BASE_URL}/configs/repost-reactions`, {
      method: "POST",
      body: JSON.stringify(req),
    })
    if (res.status !== 200) {
      throw new Error(
        `failed to update repost reaction config - guild ${req.guild_id}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async listAllRepostReactionConfigs(guildId: string) {
    const res = await fetch(
      `${API_BASE_URL}/configs/repost-reactions/${guildId}`
    )
    if (res.status !== 200) {
      throw new Error(
        `failed to list starboard configuration - guild ${guildId}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async removeSpecificRepostReactionConfig(req: RepostReactionRequest) {
    const res = await fetch(`${API_BASE_URL}/configs/repost-reactions`, {
      method: "DELETE",
      body: JSON.stringify(req),
    })
    if (res.status !== 200) {
      throw new Error(
        `failed to remove repost reaction config - guild ${req.guild_id}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }

    return json
  }

  public async getAllChains() {
    const res = await fetch(`${API_BASE_URL}/chains`, {
      method: "GET",
    })
    if (res.status !== 200) {
      throw new Error(`failed to get all chains`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async toggleActivityConfig(guildId: string, activity: string) {
    const res = await fetch(
      `${API_BASE_URL}/configs/activities/${activity}?guild_id=${guildId}`,
      {
        method: "POST",
      }
    )
    if (res.status !== 200) {
      throw new Error(
        `failed to toggle activity config - activity ${activity} - guild ${guildId}: ${res.status}`
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }

    return json.data
  }

  public async getAllCustomTokens(guild_id: string): Promise<Token[]> {
    const res = await fetch(
      `${API_BASE_URL}/guilds/${guild_id}/custom-tokens`,
      {
        method: "GET",
      }
    )
    if (res.status !== 200) {
      throw new Error(`failed to get all custom tokens of guild: ${guild_id}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw Error(json.error)
    }
    return json.data
  }

  public async createTwitterAuth(
    guildid: string,
    csmrKey: string,
    csmrKeyScrt: string,
    acsToken: string,
    acsTokenScrt: string
  ) {
    const body = {
      guild_id: guildid,
      twitter_consumer_key: csmrKey,
      twitter_consumer_secret: csmrKeyScrt,
      twitter_access_token: acsToken,
      twitter_access_token_secret: acsTokenScrt,
    }
    const res = await fetch(`${API_BASE_URL}/configs/twitter`, {
      method: "POST",
      body: JSON.stringify(body),
    })
    if (res.status !== 200) {
      throw new Error(`failed to create twitter auth`)
    }
  }

  public async setTwitterConfig(
    guild_id: string,
    data: {
      channel_id: string
      user_id: string
      hashtag: Array<string>
      twitter_username: Array<string>
      rule_id: string
    }
  ) {
    const body = {
      guild_id,
      ...data,
    }
    const res = await fetch(`${API_BASE_URL}/configs/twitter/hashtag`, {
      method: "POST",
      body: JSON.stringify(body),
    })
    if (res.status !== 200) {
      throw new Error(`failed to set twitter config`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw Error(json.error)
    }
  }

  public async getTwitterConfig(guildId = "") {
    const res = await fetch(
      `${API_BASE_URL}/configs/twitter/hashtag/${guildId}`
    )
    if (res.status !== 200) {
      throw new Error(`failed to get twitter config`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw Error(json.error)
    }

    return json.data
  }

  public async removeTwitterConfig(guildId: string) {
    const res = await fetch(
      `${API_BASE_URL}/configs/twitter/hashtag/${guildId}`,
      { method: "DELETE" }
    )
    if (res.status !== 200) {
      throw new Error(`failed to remove twitter config`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw Error(json.error)
    }
  }

  public async logTweet(data: {
    twitter_id: string
    twitter_handle: string
    tweet_id: string
    guild_id: string
  }) {
    const res = await fetch(`${API_BASE_URL}/twitter`, {
      method: "POST",
      body: JSON.stringify(data),
    })

    if (res.status !== 200) {
      throw new Error("failed to log tweet")
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw Error(json.error)
    }
  }

  public async setDefaultToken(body: { guild_id: string; symbol: string }) {
    const resp = await fetch(`${API_BASE_URL}/configs/tokens/default`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    if (resp.status !== 200) {
      throw new Error(`failed to set default token ${body.symbol}`)
    }
    return json
  }

  // for token
  public async setGuildDefaultTicker(req: {
    guild_id: string
    query: string
    default_ticker: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/default-ticker`, {
      method: "POST",
      body: JSON.stringify(req),
    })
  }

  // for token
  public async getGuildDefaultTicker(params: {
    guild_id: string
    query: string
  }) {
    return await this.jsonFetch<{ default_ticker: string }>(
      `${API_BASE_URL}/configs/default-ticker?guild_id=${params.guild_id}&query=${params.query}`
    )
  }

  // for NFT
  public async setGuildDefaultSymbol(req: {
    guild_id: string
    symbol: string
    address: string
    chain: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/default-symbol`, {
      method: "POST",
      body: JSON.stringify(req),
    })
  }

  // for NFT
  public async getGuildDefaultSymbol(params: {
    guild_id: string
    query: string
  }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/configs/default-symbol?guild_id=${params.guild_id}&query=${params.query}`
    )
  }
}

const config = new Config()
config.initialize()

export default config
