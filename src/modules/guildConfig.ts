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
  guild_id: string
  name: string
  token_address: string
  bot_scopes: string[]
  verify_channel_id: string
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
    const guilds = await this.getGuildConfigs()
    const guild = guilds.data.find((g) => g.guild_id === guildId)
    if (!guild) {
      throw new Error(`Guild ${guildId} not found`)
    }
    return guild
  }

  public getVerifyChannelId(guildId: string): string {
    return (
      this.Guilds.data.find((g) => g.guild_id === guildId)?.verify_channel_id ??
      ""
    )
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
        case 2:
          const scopeCat = scopeParts[0]
          const scopeCmd = scopeParts[1]
          if (cat === scopeCat && (scopeCmd === "*" || cmd === scopeCmd)) {
            return true
          }
        default:
          break
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
        case 2:
          const scopeCat = scopeParts[0]
          if (cat === scopeCat) {
            return true
          }
          break
        default:
      }
    }
    return false
  }

  public async createGuildConfig(guildId: string, name: string) {
    const guilds = await this.getGuildConfigs()
    const guild = guilds.data.find((g) => g.guild_id === guildId)
    if (guild) {
      throw new Error(`Guild ${guildId} already exists`)
    }

    const newGuild = {
      guild_id: guildId,
      name: name,
    }

    await (
      await fetch(API_SERVER_HOST + "/api/v1/guild", {
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
