import { Command, DefaultRoleEvent, RoleReactionEvent } from "types/common"
import { Message } from "discord.js"
import { CommandIsNotScopedError } from "errors"
import fetch from "node-fetch"
import { logger } from "../logger"
import { Guild, Guilds } from "types/config"
import { API_BASE_URL } from "utils/constants"
import { Token } from "types/defi"

class Config {
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
    return guild.bot_scopes
  }

  public async commandIsScoped(
    msg: Message,
    category: string,
    command: string
  ): Promise<boolean> {
    if (msg.channel.type === "DM") return true

    const scopes = await this.getGuildScopes(msg.guildId)
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

  public async getCurrentDefaultRole(guildId: string) {
    const res = await fetch(
      `${API_BASE_URL}/configs/default-roles?guild_id=${guildId}`
    )
    if (res.status !== 200) {
      throw new Error(`failed to get current default role - guild ${guildId}`)
    }

    const json = await res.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json
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

  public async addToken(body: string) {
    const resp = await fetch(`${API_BASE_URL}/configs/custom-tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
    })
    return resp.status
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

  public async toggleGuildGlobalXP(guildId: string, global_xp: boolean) {
    const res = await fetch(`${API_BASE_URL}/guilds/global-xp/${guildId}`, {
      method: "PUT",
      body: JSON.stringify({ global_xp }),
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
}

const config = new Config()
config.initialize()

export default config
