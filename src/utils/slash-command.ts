import { slashCommands as slCMDs } from ".."
import { Routes } from "discord-api-types/v9"
import { APPLICATION_ID, DISCORD_TOKEN } from "env"
import { logger } from "logger"
import { SlashCommand } from "types/common"
import { REST } from "@discordjs/rest"
import {
  unleash,
  getFeatures,
  appName,
  featureData,
} from "adapters/unleash/unleash"
import mochiAPI from "adapters/mochi-api"
import { ModelDiscordCMD, ResponseDiscordGuildResponse } from "types/api"

const rest = new REST({ version: "9" }).setToken(DISCORD_TOKEN)

export async function syncCommands() {
  logger.info("Started refreshing application (/) commands.")

  // Get all guilds from db
  let guilds: ResponseDiscordGuildResponse[] | undefined
  try {
    guilds = (await mochiAPI.getGuilds()).data
  } catch (error) {
    logger.error(`Failed to get guilds. ${error}`)
    return
  }

  const body = Object.entries(slCMDs ?? {}).map((e) => ({
    ...e[1].prepare(e[0]).toJSON(),
    name: e[0],
  }))

  // Filter to global and guild commands
  const commands: any[] = []
  const featureData = await getFeatures()

  body.forEach((command) => {
    if (!featureData.hasOwnProperty(command.name)) {
      return
    }

    // If feature flag is empty, add to command to all guilds
    if (featureData[command.name].length === 0) {
      commands.push(command)
      return
    }
  })

  try {
    logger.info("Started refreshing application (/) commands.")
    const current = (await rest.get(
      Routes.applicationCommands(APPLICATION_ID),
    )) as ModelDiscordCMD[]

    if (current.length < commands.length) {
      logger.info("Started adding application (/) commands.")
      try {
        const resp = await fetch(
          `https://discord.com/api/v9/applications/${APPLICATION_ID}/commands`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bot ${DISCORD_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(commands),
          },
        )
        const json = await resp.json()
        // check if json is array
        if (!Array.isArray(json)) {
          console.log(json)
        }
      } catch (err) {
        console.log(err)
      }
      return
    }

    if (current.length > commands.length) {
      const promises: Promise<any>[] = []
      current.forEach((cmd) => {
        const command = commands.find((c) => c.name === cmd.name)
        if (!command && cmd.id) {
          promises.push(
            new Promise<void>((resolve, reject) => {
              if (cmd.id) {
                rest
                  .delete(Routes.applicationCommand(APPLICATION_ID, cmd.id))
                  .then(() => {
                    logger.info(`Deleted command ${cmd.id} ${cmd.name}`)
                    resolve()
                  })
                  .catch((error) => {
                    reject(error)
                  })
              }
            }),
          )
        }
      })
      await Promise.all(promises)
    }
  } catch (error) {
    await logger.error(`Failed to register application (/) commands. ${error}`)
    return
  }

  await logger.info(
    `Successfully reloaded application (/) commands. commands: [${commands
      .map((c) => c.name)
      .join(", ")}]`,
  )

  return
}

unleash.on("changed", (stream) => {
  if (!unleash.isEnabled("mochi.discord.cmd.use_global_cmd")) {
    return
  }

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
