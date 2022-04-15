import { Command } from "types/common"
import { Message } from "discord.js"
import { CommandIsNotScopedError } from "errors"
import fetch from "node-fetch"
import { API_SERVER_HOST } from "../env"
import { logger } from "../logger"

export interface Guilds {
  data: Guild[]
}

export interface Guild {
  id: string
  name: string
  bot_scopes: string[]
  alias: string
  log_channel_id: string
}

class GuildConfig {
  public Guilds: Guilds

  public async initialize() {
    this.Guilds = await this.getGuildConfigs()
    setInterval(async () => {
      this.Guilds = await this.getGuildConfigs()
      logger.info(
        `reloaded ${this.Guilds.data.length} guild configs: ${this.Guilds.data
          .map((g) => g.name)
          .join(", ")}`
      )
    }, 3600000)
  }

  public async getGuildConfigs(): Promise<Guilds> {
    const guilds: Guilds = await (
      await fetch(API_SERVER_HOST + "/api/v1/guilds", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
    ).json()

    return guilds
  }

  public async getGuildConfig(guildId: string): Promise<Guild> {
    const res = await fetch(API_SERVER_HOST + "/api/v1/guilds/" + guildId, {
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

  public async getScopes(guildId: string): Promise<string[]> {
    const guild = await this.getGuildConfig(guildId)
    return guild.bot_scopes
  }

  public async commandIsScoped(
    guildId: string,
    category: string,
    command: string
  ): Promise<boolean> {
    const scopes = await this.getScopes(guildId)

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
    const isInScoped = await this.commandIsScoped(
      message.guildId,
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
    guildId: string,
    category: string
  ): Promise<boolean> {
    const scopes = await this.getScopes(guildId)

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

  public async createGuildConfig(guildId: string, name: string) {
    const guild = await this.getGuildConfig(guildId)
    if (guild) {
      logger.warn(`Guild ${guildId} already exists`)
      return
    }

    const newGuild = {
      id: guildId,
      name: name,
    }

    await (
      await fetch(API_SERVER_HOST + "/api/v1/guilds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newGuild),
      })
    ).json()
  }
}

const guildConfig = new GuildConfig()
guildConfig.initialize()

export default guildConfig
