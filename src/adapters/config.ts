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
        `reloaded ${this.Guilds.data.length
        } guild configs: ${this.Guilds.data.map(g => g.name).join(", ")}`
      )
    }, 3600000)
  }

  public async getGuilds(): Promise<Guilds> {
    const guilds: Guilds = await (
      await fetch(`${API_BASE_URL}/guilds`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })
    ).json()

    return guilds
  }

  public async getGuild(guildId: string): Promise<Guild> {
    const res = await fetch(`${API_BASE_URL}/guilds/` + guildId, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
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
    guildId: string,
    category: string,
    command: string
  ): Promise<boolean> {
    const scopes = await this.getGuildScopes(guildId)

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
    if (commandObject.id === "help") return
    const isInScoped = await this.commandIsScoped(
      message.guildId,
      commandObject.category,
      commandObject.command
    )
    if (!isInScoped) {
      throw new CommandIsNotScopedError({
        message,
        category: commandObject.category.toLowerCase(),
        command: commandObject.command.toLowerCase()
      })
    }
  }

  public async categoryIsScoped(
    guildId: string,
    category: string
  ): Promise<boolean> {
    const scopes = await this.getGuildScopes(guildId)

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
      name: name
    }

    await (
      await fetch(`${API_BASE_URL}/guilds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newGuild)
      })
    ).json()
  }

  public async updateGmConfig(guild_id: string, channel_id: string) {
    const resp = await fetch(`${API_BASE_URL}/configs/gm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guild_id,
        channel_id
      })
    })

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    if (resp.status !== 200 || json.message != "OK") {
      throw new Error("failed to config GM channel")
    }
  }

  public async getCurrentDefaultRole(guildId: string) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/configs/default-roles?guild_id=${guildId}`
      )

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async configureDefaultRole(event: DefaultRoleEvent) {
    try {
      const reqData = JSON.stringify(event)
      const res = await fetch(`${API_BASE_URL}/configs/default-roles`, {
        method: "POST",
        body: reqData
      })

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async removeDefaultRoleConfig(guildId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/configs/default-roles?guild_id=${guildId}`, {
        method: "DELETE",
      })

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async handleReactionEvent(event: RoleReactionEvent) {
    try {
      const body = JSON.stringify(event)
      const res = await fetch(`${API_BASE_URL}/configs/reaction-roles`, {
        method: "POST",
        body: body
      })

      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async updateReactionConfig(req: RoleReactionEvent) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/configs/reaction-roles/update-config`,
        {
          method: "POST",
          body: JSON.stringify(req)
        }
      )
      return await res.json()
    } catch (e: any) {
      logger.error(e)
    }
  }

  public async getGuildTokens(guildId: string): Promise<Token[]> {
    const resp = await fetch(
      `${API_BASE_URL}/configs/tokens?guild_id=${guildId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      }
    )

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    if (resp.status !== 200) {
      throw new Error("failed to get guild tokens configuration")
    }
    return json.data
  }

  public async updateTokenConfig({
    guild_id,
    symbol,
    active
  }: {
    guild_id: string
    symbol: string
    active: boolean
  }) {
    const resp = await fetch(`${API_BASE_URL}/configs/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guild_id,
        symbol,
        active
      })
    })

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    if (resp.status !== 200) {
      throw new Error("failed to config guild tokens")
    }
  }
}

const config = new Config()
config.initialize()

export default config

