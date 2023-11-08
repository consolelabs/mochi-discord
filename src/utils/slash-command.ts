import { Routes } from "discord-api-types/v9"
import { APPLICATION_ID, DISCORD_TOKEN } from "env"
import { logger } from "logger"
import { SlashCommand } from "types/common"
import { slashCommands as slCMDs } from "commands/const"
import { REST } from "@discordjs/rest"
import {
  unleash,
  getFeatures,
  appName,
  featureData,
} from "adapters/unleash/unleash"
import mochiAPI from "adapters/mochi-api"
import { ResponseDiscordGuildResponse } from "types/api"
import util from "util"

export let slashCommands = new Map<string, SlashCommand>()

export async function fetchCommands(): Promise<SlashCommand[]> {
  logger.info(`Loading commands...`)
  const slashCmds: SlashCommand[] = []
  for (const [name, cmd] of Object.entries(slCMDs)) {
    slashCmds.push(cmd)
  }
  return slashCmds
}

export async function initCommands() {
  logger.info("Started init application (/) commands.")
  const slashCmds = await fetchCommands()
  slashCommands = new Map(slashCmds.map((c) => [c.name, c]))
}

export async function syncCommands() {
  // Get all guilds from db
  let guilds: ResponseDiscordGuildResponse[] | undefined
  try {
    guilds = (await mochiAPI.getGuilds()).data
  } catch (error) {
    logger.error(`Failed to get guilds. ${error}`)
    return
  }

  const slashCmds = await fetchCommands()
  slashCmds.forEach((c) => {
    logger.info(`Slash command: ${util.inspect(c.name)}`)
  })
  return
  const body = slashCmds.map((c) => c.prepare())

  // Filter to global and guild commands
  const whitelistGuildCommands: any[] = []
  const guildCommands: any[] = []
  const featureData = await getFeatures()

  body.forEach((command) => {
    if (!featureData.hasOwnProperty(command.name)) {
      return
    }
    // If feature flag is empty, add to command to all guilds
    if (featureData[command.name].length === 0) {
      guildCommands.push(command)
      return
    }
    // If feature flag is not empty, add to command to whitelist guilds
    whitelistGuildCommands.push(command)
  })

  const rest = new REST({ version: "9" }).setToken(DISCORD_TOKEN)

  const guildCommandsByGuild: Record<string, any[]> = {}

  const matchingCommandsMap = whitelistGuildCommands.reduce((map, command) => {
    map[command.name] = command
    return map
  }, {})

  // for each feature, find matching commands and add to whitelist guilds
  Object.keys(featureData).forEach((feat) => {
    if (!Array.isArray(featureData[feat]) || featureData[feat].length === 0) {
      return
    }

    const matchingCommands = matchingCommandsMap[feat]
    if (!matchingCommands) {
      return
    }

    const guildIds = featureData[feat]
    guildIds.forEach((guildId) => {
      if (!guildCommandsByGuild[guildId]) {
        guildCommandsByGuild[guildId] = []
      }
      guildCommandsByGuild[guildId].push(matchingCommands)
    })
  })

  // commands that are not in features flag will be added to all guilds
  guilds?.forEach((guild) => {
    if (guild.id) {
      guildCommandsByGuild[guild.id] = guildCommandsByGuild[guild.id] || []
      guildCommandsByGuild[guild.id].push(guildCommands)
    }
  })

  logger.info("Number of guilds:", Object.keys(guildCommandsByGuild).length)
  await Promise.all(
    Object.keys(guildCommandsByGuild).map(async (guildId) => {
      try {
        const commands = guildCommandsByGuild[guildId]

        logger.info(
          `Started refreshing application guild (/) commands for guild: ${guildId}`,
        )
        await rest.put(
          Routes.applicationGuildCommands(APPLICATION_ID, guildId),
          {
            body: [],
          },
        )

        const response: any = await rest.put(
          Routes.applicationGuildCommands(APPLICATION_ID, guildId),
          {
            body: commands.flat(),
          },
        )
        await mochiAPI.updateGuild(guildId, response)

        logger.info(
          `Successfully reloaded application guild (/) commands for guild: ${guildId}. commands: [${commands
            .flat()
            .map((c) => c.name)
            .join(", ")}]`,
        )
      } catch (error) {
        logger.error(
          `Failed to refresh application guild (/) commands for guild: ${guildId}. ${error}`,
        )
      }
    }),
  )

  return
}

unleash.on("changed", (stream) => {
  let changed = false
  try {
    stream.forEach((feature: any) => {
      if (!String(feature.name).includes(appName)) {
        return
      }
      if (!featureData[feature.name]) {
        featureData[feature.name] = feature
        return
      }
      if (
        JSON.stringify(featureData[feature.name]) !== JSON.stringify(feature)
      ) {
        logger.info("Unleash toggles updated")
        changed = true
      }
      featureData[feature.name] = feature
    })
  } catch (error) {
    console.log(error)
  }
  if (changed) {
    syncCommands()
    logger.info("Unleash toggles synced")
  } else {
    logger.info("Unleash toggles not changed")
  }
})
