import {
  Command,
  DefaultRoleEvent,
  RepostReactionRequest,
  RequestConfigRepostReactionConversation,
  BlacklistChannelRepostConfigRequest,
} from "types/common"
import { Message } from "discord.js"
import { CommandIsNotScopedError } from "errors"
import fetch from "node-fetch"
import { logger } from "../logger"
import { Guild, Guilds, RoleReactionEvent } from "types/config"
import { API_BASE_URL } from "utils/constants"
import { Token } from "types/defi"
import { Fetcher } from "./fetcher"
import {
  ResponseGetLevelRoleConfigsResponse,
  ResponseListGuildGroupNFTRolesResponse,
  ResponseGetWelcomeChannelConfigResponse,
  ResponseDataListRoleReactionResponse,
  ResponseGetGuildDefaultNftTickerResponse,
  RequestUpsertGmConfigRequest,
  ResponseMonikerConfigResponse,
  RequestDeleteMonikerConfigRequest,
  RequestUpsertMonikerConfigRequest,
  ResponseListGuildTokenRoles,
  ResponseGetVaultsResponse,
  ResponseCommandPermissions,
} from "types/api"
import { TEST } from "env"
import { formatUsdDigit } from "utils/defi"

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
            .join(", ")}`,
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
    command: string,
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
    commandObject: Command,
  ) {
    if (commandObject.id === "help" || message.channel.type === "DM") return
    const isInScoped = await this.commandIsScoped(
      message,
      commandObject.category,
      commandObject.command,
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
    category: string,
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
    const res = await fetch(
      `${API_BASE_URL}/config-channels/gm?guild_id=${guildId}`,
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

  public async updateGmConfig(body: RequestUpsertGmConfigRequest) {
    return await this.jsonFetch<RequestUpsertGmConfigRequest>(
      `${API_BASE_URL}/config-channels/gm`,
      {
        method: "POST",
        body,
      },
    )
  }

  public async getCurrentWelcomeConfig(guildId: string) {
    return await this.jsonFetch<ResponseGetWelcomeChannelConfigResponse>(
      `${API_BASE_URL}/config-channels/welcome`,
      {
        query: {
          guildId,
        },
      },
    )
  }

  public async updateWelcomeConfig(
    guild_id: string,
    channel_id: string,
    welcome_message = "",
  ) {
    return this.jsonFetch<ResponseGetWelcomeChannelConfigResponse>(
      `${API_BASE_URL}/config-channels/welcome`,
      {
        method: "POST",
        body: JSON.stringify({
          guild_id,
          channel_id,
          welcome_message,
        }),
      },
    )
  }

  public async removeWelcomeConfig(guild_id: string) {
    return await this.jsonFetch(`${API_BASE_URL}/config-channels/welcome`, {
      method: "DELETE",
      body: JSON.stringify({
        guild_id,
      }),
    })
  }

  public async getCurrentSalesConfig(guildId: string) {
    const res = await fetch(
      `${API_BASE_URL}/configs/sales-tracker?guild_id=${guildId}`,
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
    return this.jsonFetch(`${API_BASE_URL}/config/role/${guildId}/default`)
  }

  public async configureDefaultRole(event: DefaultRoleEvent) {
    return this.jsonFetch(
      `${API_BASE_URL}/config/role/${event.guild_id}/default`,
      {
        method: "POST",
        body: JSON.stringify(event),
      },
    )
  }

  public async removeDefaultRoleConfig(guildId: string) {
    return this.jsonFetch(`${API_BASE_URL}/config/role/${guildId}/default`, {
      method: "DELETE",
    })
  }

  public async listAllReactionRoles(guildId: string) {
    return this.jsonFetch<ResponseDataListRoleReactionResponse>(
      `${API_BASE_URL}/config/role/${guildId}/reaction`,
      {
        query: {
          guildId,
        },
      },
    )
  }

  public async handleReactionEvent(event: RoleReactionEvent) {
    const res = await fetch(
      `${API_BASE_URL}/config/role/${event.guild_id}/reaction/filter`,
      {
        method: "POST",
        body: JSON.stringify(event),
      },
    )
    if (res.status !== 200) {
      throw new Error(
        `failed to handle reaction event - guild ${event.guild_id}`,
      )
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
  }

  public async updateReactionConfig(req: RoleReactionEvent) {
    return this.jsonFetch(
      `${API_BASE_URL}/config/role/${req.guild_id}/reaction`,
      {
        method: "POST",
        body: JSON.stringify(req),
      },
    )
  }

  public async removeReactionConfig(req: RoleReactionEvent) {
    return this.jsonFetch(
      `${API_BASE_URL}/config/role/${req.guild_id}/reaction`,
      {
        method: "DELETE",
        body: JSON.stringify(req),
      },
    )
  }

  public async getGuildTokens(guildId: string) {
    return await this.jsonFetch<Token[]>(`${API_BASE_URL}/config-defi/tokens`, {
      method: "GET",
      query: { guildId },
    })
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
    const res = await fetch(`${API_BASE_URL}/config-defi/tokens`, {
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
    return this.jsonFetch(`${API_BASE_URL}/config-defi/custom-tokens`, {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  public async configLevelRole(data: any) {
    return await this.jsonFetch<ResponseGetLevelRoleConfigsResponse>(
      `${API_BASE_URL}/config/role/${data.guildID}/level`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    )
  }

  public async getGuildLevelRoleConfigs(guildId: string) {
    return this.jsonFetch<ResponseGetLevelRoleConfigsResponse>(
      `${API_BASE_URL}/config/role/${guildId}/level`,
      {
        method: "GET",
      },
    )
  }

  public async removeGuildLevelRoleConfig(guildId: string, level: number) {
    return this.jsonFetch(
      `${API_BASE_URL}/config/role/${guildId}/level?level=${level}`,
      {
        method: "DELETE",
      },
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

  public async newGuildNFTRoleConfig(body: any) {
    return await this.jsonFetch<ResponseListGuildGroupNFTRolesResponse>(
      `${API_BASE_URL}/config/role/${body.guildID}/nft`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    )
  }

  public async getGuildNFTRoleConfigs(guildId: string) {
    return await this.jsonFetch<ResponseListGuildGroupNFTRolesResponse>(
      `${API_BASE_URL}/config/role/${guildId}/nft`,
      {
        query: {
          guildId,
        },
      },
    )
  }

  public async removeGuildNFTRoleConfig(configIds: Array<string>) {
    return await this.jsonFetch(`${API_BASE_URL}/config/role/guildId/nft`, {
      method: "DELETE",
      query: {
        configIds,
      },
    })
  }

  public async removeGuildNFTRoleGroupConfig(
    groupConfigId: string,
    guildId: string,
  ) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config/role/${guildId}/nft/group`,
      {
        method: "DELETE",
        query: {
          groupConfigId,
        },
      },
    )
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
    req: RequestConfigRepostReactionConversation,
  ) {
    return this.jsonFetch(
      `${API_BASE_URL}/community/repost-reactions/conversation`,
      {
        method: "POST",
        body: JSON.stringify(req),
      },
    )
  }

  public async updateRepostReactionConfig(req: RepostReactionRequest) {
    return this.jsonFetch(`${API_BASE_URL}/community/repost-reactions`, {
      method: "POST",
      body: JSON.stringify(req),
    })
  }

  public async removeSpecificRepostReactionConfig(req: RepostReactionRequest) {
    return this.jsonFetch(`${API_BASE_URL}/community/repost-reactions`, {
      method: "DELETE",
      body: JSON.stringify(req),
    })
  }

  public async removeRepostReactionConversationConfig(
    req: RequestConfigRepostReactionConversation,
  ) {
    return this.jsonFetch(
      `${API_BASE_URL}/community/repost-reactions/conversation`,
      {
        method: "DELETE",
        body: req,
      },
    )
  }

  public async getAllChains() {
    const res = await fetch(`${API_BASE_URL}/defi/chains`, {
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
      `${API_BASE_URL}/data/activities/${activity}?guild_id=${guildId}`,
      {
        method: "POST",
      },
    )
    if (res.status !== 200) {
      throw new Error(
        `failed to toggle activity config - activity ${activity} - guild ${guildId}: ${res.status}`,
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
      },
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

  public async setDefaultToken(body: { guild_id: string; symbol: string }) {
    return await this.jsonFetch(`${API_BASE_URL}/config-defi/tokens/default`, {
      method: "POST",
      body,
    })
  }

  // for token
  public async setGuildDefaultTicker(req: {
    guild_id: string
    query: string
    default_ticker: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/config-defi/default-ticker`, {
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
      `${API_BASE_URL}/config-defi/default-ticker?guild_id=${params.guild_id}&query=${params.query}`,
    )
  }

  public async getListGuildDefaultTicker(guild_id: string) {
    return await this.jsonFetch<{
      data: { default_ticker: string; query: string }[]
    }>(`${API_BASE_URL}/config-defi/default-ticker/${guild_id}`)
  }

  // for NFT
  public async setGuildDefaultSymbol(req: {
    guild_id: string
    symbol: string
    address: string
    chain: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/config-defi/default-symbol`, {
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
      `${API_BASE_URL}/config-defi/default-symbol?guild_id=${params.guild_id}&query=${params.query}`,
    )
  }

  public async setGuildDefaultNFTTicker(req: {
    guild_id: string
    collection_address: string
    symbol: string
    chain_id: number
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/nfts/default-nft-ticker`, {
      method: "POST",
      body: req,
    })
  }

  public async getGuildDefaultNFTTicker(query: {
    guild_id: string
    query: string
  }) {
    return await this.jsonFetch<ResponseGetGuildDefaultNftTickerResponse>(
      `${API_BASE_URL}/nfts/default-nft-ticker`,
      {
        query,
      },
    )
  }

  public async setJoinLeaveChannel(guildId: string, channelId: string) {
    return await this.jsonFetch(`${API_BASE_URL}/config-channels/join-leave`, {
      method: "POST",
      body: { guildId, channelId },
    })
  }

  public async removeJoinLeaveChannel(guildId: string) {
    return await this.jsonFetch(`${API_BASE_URL}/config-channels/join-leave`, {
      method: "DELETE",
      body: {
        guildId,
      },
    })
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
      `${API_BASE_URL}/community/repost-reactions/message-repost`,
      {
        method: "PUT",
        body: req,
      },
    )
  }

  public async setBlacklistChannelRepostConfig(
    req: BlacklistChannelRepostConfigRequest,
  ) {
    return await this.jsonFetch(
      `${API_BASE_URL}/community/repost-reactions/blacklist-channel`,
      {
        method: "POST",
        body: req,
      },
    )
  }

  public async removeBlacklistChannelRepostConfig(
    req: BlacklistChannelRepostConfigRequest,
  ) {
    return await this.jsonFetch(
      `${API_BASE_URL}/community/repost-reactions/blacklist-channel`,
      {
        method: "DELETE",
        body: req,
      },
    )
  }

  public async getBlacklistChannelRepostConfig(guild_id: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/community/repost-reactions/blacklist-channel`,
      {
        query: {
          guild_id,
        },
      },
    )
  }

  public async getMonikerConfig(guild_id: string) {
    return await this.jsonFetch<ResponseMonikerConfigResponse>(
      `${API_BASE_URL}/config-defi/monikers/${guild_id}`,
    )
  }

  public async deleteMonikerConfig(req: RequestDeleteMonikerConfigRequest) {
    return await this.jsonFetch(`${API_BASE_URL}/config-defi/monikers`, {
      method: "DELETE",
      body: req,
    })
  }

  public async setMonikerConfig(req: RequestUpsertMonikerConfigRequest) {
    return await this.jsonFetch(`${API_BASE_URL}/config-defi/monikers`, {
      method: "POST",
      body: req,
    })
  }

  public async getDefaultMoniker() {
    return await this.jsonFetch<ResponseMonikerConfigResponse>(
      `${API_BASE_URL}/config-defi/monikers/default`,
    )
  }

  public async createProposalChannel(req: {
    guild_id: string
    channel_id: string
    authority: string
    type?: string
    address?: string
    chain?: string
    required_amount?: number
  }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config-channels/${req.guild_id}/proposal`,
      {
        method: "POST",
        body: req,
      },
    )
  }

  public async getGuildConfigDaoProposal(guildId: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config-channels/${guildId}/proposal`,
    )
  }

  public async deleteProposalChannelConfig(req: { id: string }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config-channels/guildId/proposal`,
      {
        method: "DELETE",
        body: req,
      },
    )
  }

  public async setConfigTokenRole(req: {
    guild_id: string
    role_id: string
    address: string
    chain: string
    amount: number
  }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config/role/${req.guild_id}/token`,
      {
        method: "POST",
        body: req,
      },
    )
  }

  public async getConfigTokenRoleList(guild_id: string) {
    return await this.jsonFetch<ResponseListGuildTokenRoles>(
      `${API_BASE_URL}/config/role/${guild_id}/token`,
    )
  }

  public async removeGuildTokenRoleConfig(id: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config/role/guildId/token/${id}`,
      {
        method: "DELETE",
      },
    )
  }

  public async setConfigXPRole(req: {
    guild_id: string
    role_id: string
    xp: number
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/config-roles/xp-roles`, {
      method: "POST",
      body: req,
    })
  }

  public async removeGuildXPRoleConfig(id: string) {
    return await this.jsonFetch(`${API_BASE_URL}/config-roles/xp-roles/${id}`, {
      method: "DELETE",
    })
  }

  public async getSaleTwitterConfigs(query: { marketplace?: string }) {
    return await this.jsonFetch(`${API_BASE_URL}/configs/twitter-sales`, {
      query,
    })
  }

  public async removeGuildMixRoleConfig(id: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config-roles/mix-roles/${id}`,
      {
        method: "DELETE",
      },
    )
  }

  public async getProposalUsageStats(query: { page: number; size: number }) {
    return await this.jsonFetch(`${API_BASE_URL}/data/usage-stats/proposal`, {
      query,
    })
  }

  public async getDaoTrackerUsageStats(query: { page: number; size: number }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/data/usage-stats/dao-tracker`,
      { query },
    )
  }

  public async vaultList(
    guildId: string,
    noFetchAmount?: boolean,
    profileId?: string,
  ) {
    const { data, ok } = await this.jsonFetch<ResponseGetVaultsResponse>(
      `${API_BASE_URL}/vault`,
      {
        query: {
          guildId,
          profileId,
          ...(noFetchAmount ? { noFetchAmount } : {}),
        },
      },
    )
    if (!ok) return []

    return data.map((v) => {
      const allTotals = Object.keys(v).filter((k) =>
        k.startsWith("total_amount"),
      )

      const total = allTotals.reduce(
        (acc, c) => (acc += Number(v[c as keyof typeof v])),
        0,
      )

      return {
        ...v,
        total: formatUsdDigit(total),
      }
    })
  }

  public async createVault(req: {
    guild_id: string
    name: string
    threshold: string
    vault_creator: string
    desig_mode?: boolean
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/vault`, {
      method: "POST",
      body: req,
    })
  }

  public async createVaultConfigChannel(req: {
    guild_id: string
    channel_id: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/vault/config/channel`, {
      method: "POST",
      body: req,
    })
  }

  public async createVaultConfigThreshold(req: {
    guild_id: string
    name: string
    threshold: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/vault/config/threshold`, {
      method: "PUT",
      body: req,
    })
  }

  public async getVaultConfigThreshold(guildId: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/vault/config/channel?guild_id=${guildId}`,
    )
  }

  public async getVaultInfo() {
    return await this.jsonFetch(`${API_BASE_URL}/vault/info`)
  }

  public async createTreasureRequest(req: {
    guild_id: string
    vault_name: string
    user_profile_id?: string
    message: string
    requester_profile_id: string
    type: string
    amount?: string
    chain?: string
    token?: string
    address?: string
    message_url?: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/vault/treasurer/request`, {
      method: "POST",
      body: {
        ...req,
        platform: "discord",
      },
    })
  }

  public async getTreasurerRequest(requestId: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/vault/treasurer/request/${requestId}`,
    )
  }

  public async createTreasurerSubmissions(req: {
    vault_id: number
    request_id: number
    submitter_profile_id: string
    choice: string
    type: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/vault/treasurer/submission`, {
      method: "POST",
      body: req,
    })
  }

  public async addTreasurerToVault(req: {
    vault_id: number
    guild_id: string
    user_profile_id: string
    channel_id: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/vault/treasurer`, {
      method: "POST",
      body: req,
    })
  }

  public async transferVaultToken(req: {
    vault_id: number
    request_id: number
    guild_id: string
    address: string
    target: string
    amount: string
    token: string
    chain: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/vault/treasurer/transfer`, {
      method: "POST",
      body: {
        ...req,
        platform: "discord",
      },
    })
  }

  public async removeTreasurerFromVault(req: {
    vault_id: number
    guild_id: string
    user_profile_id: string
    channel_id: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/vault/treasurer`, {
      method: "DELETE",
      body: req,
    })
  }

  async getDefaultCurrency(guild_id: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config-defi/default-currency`,
      {
        query: { guild_id },
      },
    )
  }

  async setDefaultCurrency(body: { symbol: string; guild_id: string }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config-defi/default-currency`,
      {
        method: "POST",
        body,
      },
    )
  }

  public async deleteDefaultCurrency(guild_id: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config-defi/default-currency`,
      {
        method: "DELETE",
        query: { guild_id },
      },
    )
  }

  public async getVaultDetail(vault_name: string, guild_id: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/vault/detail?vaultName=${vault_name}&guildId=${guild_id}`,
    )
  }

  public async setTipRangeConfig(body: {
    guildId: string
    min?: number
    max?: number
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/config-defi/tip-range`, {
      method: "POST",
      body,
    })
  }

  public async getTipRangeConfig(guildId: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config-defi/tip-range/${guildId}`,
      {
        method: "GET",
      },
    )
  }

  public async deleteTipRangeConfig(guild_id: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config-defi/tip-range/${guild_id}`,
      {
        method: "DELETE",
      },
    )
  }

  public async setGuildAdminRole(body: {
    guild_id: string
    role_ids: string[]
  }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config/role/${body.guild_id}/bot-manager`,
      {
        method: "POST",
        body,
      },
    )
  }

  public async getGuildAdminRoles(query: { guildId: string }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config/role/${query.guildId}/bot-manager`,
      {
        method: "GET",
        query,
      },
    )
  }

  public async removeGuildAdminRole(id: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config/role/guildId/bot-manager/${id}`,
      {
        method: "DELETE",
      },
    )
  }

  public async getContent(type: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/product-metadata/copy/${type}`,
      {
        method: "GET",
      },
    )
  }

  public async setLogchannel(
    guildId: string,
    body: { channel_id: string; log_type: string },
  ) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config/log-channel/${guildId}`,
      {
        method: "POST",
        body,
      },
    )
  }

  public async getLogchannel(guildId: string, logType: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config/log-channel/${guildId}/${logType}`,
      {
        method: "GET",
      },
    )
  }

  public async getHashtagTemplate(alias: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/product-metadata/hashtags?alias=${alias}`,
    )
  }

  public async getCommandPermissions(command?: string) {
    return await this.jsonFetch<ResponseCommandPermissions>(
      `${API_BASE_URL}/config/command-permissions`,
      {
        query: {
          code: command,
        },
      },
    )
  }
}

const config = new Config()
config.initialize()

export default config
