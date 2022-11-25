import {
  Command,
  DefaultRoleEvent,
  RepostReactionRequest,
  RoleReactionEvent,
  RequestConfigRepostReactionConversation,
  BlacklistChannelRepostConfigRequest,
} from "types/common"
import { Message } from "discord.js"
import { CommandIsNotScopedError } from "errors"
import fetch from "node-fetch"
import { logger } from "../logger"
import { Guild, Guilds } from "types/config"
import { API_BASE_URL } from "utils/constants"
import { Token } from "types/defi"
import { Fetcher } from "./fetcher"
import {
  RequestConfigGroupNFTRoleRequest,
  RequestConfigLevelRoleRequest,
  RequestTwitterHashtag,
  ResponseGetLevelRoleConfigsResponse,
  ResponseGetTwitterHashtagConfigResponse,
  ResponseListGuildGroupNFTRolesResponse,
  ResponseGetWelcomeChannelConfigResponse,
  ResponseGetVoteChannelConfigResponse,
  ResponseDataListRoleReactionResponse,
  ResponseGetGuildPruneExcludeResponse,
  ResponseGetGuildDefaultNftTickerResponse,
  ResponseGetRepostReactionConfigsResponse,
  ResponseGetAllTwitterHashtagConfigResponse,
  RequestUpsertGmConfigRequest,
  ResponseMonikerConfigResponse,
  RequestDeleteMonikerConfigRequest,
  RequestUpsertMonikerConfigRequest,
} from "types/api"
import { TEST } from "env"

class Config extends Fetcher {
  public Guilds?: Guilds

  public async initialize() {
    if (!TEST) {
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

  public async getGuild(guildId: string): Promise<Guild | null> {
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
    return guild?.bot_scopes ?? []
  }

  // TODO: remove after slash command migration done
  public async commandIsScoped(
    msg: Message,
    category: string,
    command: string
  ): Promise<boolean> {
    if (msg.channel.type === "DM") return true
    if (!msg.guildId) return false
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

  // TODO: remove after slash command migration done
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

  // TODO: remove after slash command migration done
  public async categoryIsScoped(
    msg: Message,
    category: string
  ): Promise<boolean> {
    if (msg.channel.type === "DM") return true
    if (!msg.guildId) return false
    const scopes = await this.getGuildScopes(msg.guildId)
    if (!scopes) return false
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

  public async updateGmConfig(body: RequestUpsertGmConfigRequest) {
    return await this.jsonFetch<RequestUpsertGmConfigRequest>(
      `${API_BASE_URL}/configs/gm`,
      {
        method: "POST",
        body,
      }
    )
  }

  public async getCurrentWelcomeConfig(guildId: string) {
    return await this.jsonFetch<ResponseGetWelcomeChannelConfigResponse>(
      `${API_BASE_URL}/configs/welcome`,
      {
        query: {
          guildId,
        },
      }
    )
  }

  public async updateWelcomeConfig(
    guild_id: string,
    channel_id: string,
    welcome_message = ""
  ) {
    return this.jsonFetch<ResponseGetWelcomeChannelConfigResponse>(
      `${API_BASE_URL}/configs/welcome`,
      {
        method: "POST",
        body: JSON.stringify({
          guild_id,
          channel_id,
          welcome_message,
        }),
      }
    )
  }

  public async removeWelcomeConfig(guild_id: string) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/welcome`, {
      method: "DELETE",
      body: JSON.stringify({
        guild_id,
      }),
    })
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
    return this.jsonFetch(
      `${API_BASE_URL}/configs/default-roles?guild_id=${guildId}`
    )
  }

  public async configureDefaultRole(event: DefaultRoleEvent) {
    return this.jsonFetch(`${API_BASE_URL}/configs/default-roles`, {
      method: "POST",
      body: JSON.stringify(event),
    })
  }

  public async removeDefaultRoleConfig(guildId: string) {
    return this.jsonFetch(
      `${API_BASE_URL}/configs/default-roles?guild_id=${guildId}`,
      { method: "DELETE" }
    )
  }

  public async listAllReactionRoles(guildId: string) {
    return this.jsonFetch<ResponseDataListRoleReactionResponse>(
      `${API_BASE_URL}/configs/reaction-roles`,
      {
        query: {
          guildId,
        },
      }
    )
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
    return this.jsonFetch(`${API_BASE_URL}/configs/reaction-roles`, {
      method: "POST",
      body: JSON.stringify(req),
    })
  }

  public async removeReactionConfig(req: RoleReactionEvent) {
    return this.jsonFetch(`${API_BASE_URL}/configs/reaction-roles`, {
      method: "DELETE",
      body: JSON.stringify(req),
    })
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
    return this.jsonFetch(`${API_BASE_URL}/configs/custom-tokens`, {
      autoWrap500Error: false,
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  public async configLevelRole(data: RequestConfigLevelRoleRequest) {
    return this.jsonFetch<ResponseGetLevelRoleConfigsResponse>(
      `${API_BASE_URL}/configs/level-roles`,
      {
        autoWrap500Error: false,
        method: "POST",
        body: JSON.stringify(data),
      }
    )
  }

  public async getGuildLevelRoleConfigs(guildId: string) {
    return this.jsonFetch<ResponseGetLevelRoleConfigsResponse>(
      `${API_BASE_URL}/configs/level-roles/${guildId}`,
      {
        method: "GET",
      }
    )
  }

  public async removeGuildLevelRoleConfig(guildId: string, level: number) {
    return this.jsonFetch(
      `${API_BASE_URL}/configs/level-roles/${guildId}?level=${level}`,
      {
        method: "DELETE",
      }
    )
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
    return await this.jsonFetch(`${API_BASE_URL}/guilds/${guildId}`, {
      method: "PUT",
      body: {
        ...(globalXP && { global_xp: globalXP }),
        ...(logChannel && { log_channel: logChannel }),
      },
    })
  }

  public async newGuildNFTRoleConfig(body: RequestConfigGroupNFTRoleRequest) {
    return this.jsonFetch<ResponseListGuildGroupNFTRolesResponse>(
      `${API_BASE_URL}/configs/nft-roles`,
      {
        autoWrap500Error: false,
        method: "POST",
        body: JSON.stringify(body),
      }
    )
  }

  public async getGuildNFTRoleConfigs(guildId: string) {
    return await this.jsonFetch<ResponseListGuildGroupNFTRolesResponse>(
      `${API_BASE_URL}/configs/nft-roles`,
      {
        query: {
          guildId,
        },
      }
    )
  }

  public async removeGuildNFTRoleConfig(configIds: Array<string>) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/nft-roles`, {
      method: "DELETE",
      query: {
        configIds,
      },
    })
  }

  public async removeGuildNFTRoleGroupConfig(groupConfigId: string) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/nft-roles/group`, {
      method: "DELETE",
      query: {
        groupConfigId,
      },
    })
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

  public async CreateConfigRepostReactionStartStop(
    req: RequestConfigRepostReactionConversation
  ) {
    return this.jsonFetch(
      `${API_BASE_URL}/configs/repost-reactions/conversation`,
      {
        method: "POST",
        body: JSON.stringify(req),
      }
    )
  }

  public async updateRepostReactionConfig(req: RepostReactionRequest) {
    return this.jsonFetch(`${API_BASE_URL}/configs/repost-reactions`, {
      method: "POST",
      body: JSON.stringify(req),
    })
  }

  public async listAllRepostReactionConfigs(
    guildId: string,
    reactionType: string
  ) {
    return this.jsonFetch<ResponseGetRepostReactionConfigsResponse>(
      `${API_BASE_URL}/configs/repost-reactions/${guildId}?reaction_type=${reactionType}`
    )
  }

  public async removeSpecificRepostReactionConfig(req: RepostReactionRequest) {
    return this.jsonFetch(`${API_BASE_URL}/configs/repost-reactions`, {
      method: "DELETE",
      body: JSON.stringify(req),
    })
  }

  public async removeRepostReactionConversationConfig(
    req: RequestConfigRepostReactionConversation
  ) {
    return this.jsonFetch(
      `${API_BASE_URL}/configs/repost-reactions/conversation`,
      {
        method: "DELETE",
        body: req,
      }
    )
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

  public async setTwitterConfig(data: RequestTwitterHashtag) {
    return await this.jsonFetch<ResponseGetTwitterHashtagConfigResponse>(
      `${API_BASE_URL}/configs/twitter/hashtag`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    )
  }

  public async getTwitterConfig(guildId = "") {
    return await this.jsonFetch<ResponseGetAllTwitterHashtagConfigResponse>(
      `${API_BASE_URL}/configs/twitter/hashtag/${guildId}`
    )
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
    content: string
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

  public async getTwitterLeaderboard(query: {
    guild_id: string
    page: number
    size?: number
  }) {
    query.size = query.size ?? 10
    return await this.jsonFetch(`${API_BASE_URL}/twitter/top`, {
      method: "GET",
      query,
    })
  }

  public async addToTwitterBlackList(body: {
    guild_id: string
    twitter_id: string
    twitter_username: string
    created_by: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/twitter/blacklist`, {
      method: "POST",
      body,
    })
  }

  public async removeFromTwitterBlackList(query: {
    guild_id: string
    twitter_id: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/twitter/blacklist`, {
      method: "DELETE",
      query,
    })
  }

  public async getTwitterBlackList(guildId: string) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/twitter/blacklist`, {
      query: { guildId },
    })
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
    return await this.jsonFetch<{
      data: { default_ticker: string; query: string }
    }>(
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

  public async setGuildDefaultNFTTicker(req: {
    guild_id: string
    query: string
    collection_address: string
    symbol: string
    chain_id: number
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/default-nft-ticker`, {
      method: "POST",
      body: req,
    })
  }

  public async getGuildDefaultNFTTicker(query: {
    guild_id: string
    query: string
  }) {
    return await this.jsonFetch<ResponseGetGuildDefaultNftTickerResponse>(
      `${API_BASE_URL}/configs/default-nft-ticker`,
      {
        query,
      }
    )
  }

  public async linkTelegramAccount(req: {
    discord_id: string
    telegram_username: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/telegram`, {
      method: "POST",
      body: JSON.stringify(req),
    })
  }

  public async setVoteChannel(guildId: string, channelId: string) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/upvote`, {
      method: "POST",
      body: { guildId, channelId },
    })
  }

  public async removeVoteChannel(guildId: string) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/upvote`, {
      method: "DELETE",
      body: {
        guildId,
      },
    })
  }

  public async getVoteChannel(guildId: string) {
    return await this.jsonFetch<ResponseGetVoteChannelConfigResponse>(
      `${API_BASE_URL}/configs/upvote`,
      {
        query: {
          guildId,
        },
      }
    )
  }

  public async setJoinLeaveChannel(guildId: string, channelId: string) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/join-leave`, {
      method: "POST",
      body: { guildId, channelId },
    })
  }

  public async removeJoinLeaveChannel(guildId: string) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/join-leave`, {
      method: "DELETE",
      body: {
        guildId,
      },
    })
  }

  public async getJoinLeaveChannel(guildId: string) {
    return await this.jsonFetch<ResponseGetVoteChannelConfigResponse>(
      `${API_BASE_URL}/configs/join-leave`,
      {
        query: {
          guildId,
        },
      }
    )
  }

  public async getExcludedRole({ guild_id }: { guild_id: string }) {
    return await this.jsonFetch<ResponseGetGuildPruneExcludeResponse>(
      `${API_BASE_URL}/configs/whitelist-prune`,
      {
        query: {
          guild_id,
        },
      }
    )
  }

  public async createExcludedRole(role_id: string, guild_id: string) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/whitelist-prune`, {
      method: "POST",
      body: {
        role_id,
        guild_id,
      },
    })
  }

  public async removeExcludedRole(role_id: string, guild_id: string) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/whitelist-prune`, {
      method: "DELETE",
      body: {
        role_id,
        guild_id,
      },
    })
  }

  public async editMessageRepost(req: {
    guild_id: string
    origin_message_id: string
    origin_channel_id: string
    repost_channel_id: string
    repost_message_id: string
  }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/configs/repost-reactions/message-repost`,
      {
        method: "PUT",
        body: req,
      }
    )
  }

  public async setBlacklistChannelRepostConfig(
    req: BlacklistChannelRepostConfigRequest
  ) {
    return await this.jsonFetch(
      `${API_BASE_URL}/configs/repost-reactions/blacklist-channel`,
      {
        method: "POST",
        body: req,
      }
    )
  }

  public async removeBlacklistChannelRepostConfig(
    req: BlacklistChannelRepostConfigRequest
  ) {
    return await this.jsonFetch(
      `${API_BASE_URL}/configs/repost-reactions/blacklist-channel`,
      {
        method: "DELETE",
        body: req,
      }
    )
  }

  public async getBlacklistChannelRepostConfig(guild_id: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/configs/repost-reactions/blacklist-channel`,
      {
        query: {
          guild_id,
        },
      }
    )
  }

  public async getMonikerConfig(guild_id: string) {
    return await this.jsonFetch<ResponseMonikerConfigResponse>(
      `${API_BASE_URL}/configs/monikers/${guild_id}`
    )
  }

  public async deleteMonikerConfig(req: RequestDeleteMonikerConfigRequest) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/monikers`, {
      method: "DELETE",
      body: req,
    })
  }

  public async setMonikerConfig(req: RequestUpsertMonikerConfigRequest) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/monikers`, {
      method: "POST",
      body: req,
    })
  }
}

const config = new Config()
config.initialize()

export default config
