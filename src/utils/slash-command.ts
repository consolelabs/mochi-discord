import { slashCommands as slCMDs } from ".."
import { Routes } from "discord-api-types/v9"
import { APPLICATION_ID, DEV, DISCORD_TOKEN } from "env"
import { logger } from "logger"
import { SlashCommand } from "types/common"
import { REST } from "@discordjs/rest"
import { getFeatures } from "adapters/unleash/unleash"
import mochiAPI from "adapters/mochi-api"
import { ModelDiscordCMD, ResponseDiscordGuildResponse } from "types/api"

const rest = new REST({ version: "9" }).setToken(DISCORD_TOKEN)

export async function syncCommands() {
  logger.info("Started refreshing application (/) commands.")
  const body = Object.entries(slCMDs ?? {}).map((e) => ({
    ...e[1].prepare(e[0]).toJSON(),
    name: e[0],
  }))

  // Filter to global and guild commands
  let globalCommands: any[] = []
  let guildCommands: Record<string, any[]> = {}
  const featureData = await getFeatures()

  body.forEach((command) => {
    if (!featureData.hasOwnProperty(command.name)) {
      return
    }
    // If feature flag is empty, add to command to all guilds by using global commands
    if (featureData[command.name].length === 0) {
      globalCommands.push(command)
      return
    }
    // If feature flag is not empty (that means it has strategy.constrains), add to command to whitelist guilds
    featureData[command.name].forEach((guildId) => {
      if (!guildCommands[guildId]) {
        guildCommands[guildId] = []
      }
      guildCommands[guildId].push(command)
    })
  })

  // Register global commands
  await processGlobalCommand(globalCommands)

  // Register guild commands
  await processGuildCommand(guildCommands)

  // clean up guild commands that existed in global commands
  // Get all guilds from db
  await cleanupGuildCommand(globalCommands)

  logger.info("Successfully synced commands!")
}

export async function registerCommand() {
  console.log("Deploying commands to global...")
  const body = Object.entries(slCMDs ?? {}).map((e) => ({
    ...e[1].prepare(e[0]).toJSON(),
    name: e[0],
  }))
  await rest
    .put(Routes.applicationCommands(APPLICATION_ID), {
      body,
    })
    .catch(console.log)
  console.log("Successfully deployed commands!")
}

async function cleanupGuildCommand(globalCommands: any[]) {
  logger.info("Started cleanup guild commands.")
  let guilds: ResponseDiscordGuildResponse[]
  try {
    guilds = (await mochiAPI.getGuilds()).data as ResponseDiscordGuildResponse[]
  } catch (error) {
    logger.error(`Failed to get guilds. ${error}`)
    return
  }

  await Promise.all(
    guilds.map(async (guild) => {
      if (!guild?.id) {
        return
      }

      let current: ModelDiscordCMD[] = []
      try {
        current = (await rest.get(
          Routes.applicationGuildCommands(APPLICATION_ID, guild.id),
        )) as ModelDiscordCMD[]
      } catch (error) {
        logger.error(
          `Failed to get guild commands for guild ${guild.id}. ${error}`,
        )
        return
      }

      const commandsToDelete = current.filter((c) =>
        globalCommands.some((cmd) => cmd.name == c.name),
      )

      await Promise.all(
        commandsToDelete.map(async (command) => {
          if (command && command.id) {
            logger.info(
              `Deleting guild command {${command.id} ${command.name}} which is a global command from guild ${guild.id}`,
            )
            try {
              await rest.delete(
                Routes.applicationGuildCommand(
                  APPLICATION_ID,
                  String(guild.id),
                  command.id,
                ),
              )
            } catch (error) {
              logger.error(
                `Failed to delete guild command {${command.id} ${command.name}} which is a global command from guild ${guild.id}. ${error}`,
              )
            }
          }
        }),
      )
    }),
  )
}

async function processGuildCommand(guildCommands: Record<string, any[]>) {
  await Promise.all(
    Object.keys(guildCommands).map(async (guildId) => {
      const commands = guildCommands[guildId]

      let current: ModelDiscordCMD[] = []
      try {
        let current = (await rest.get(
          Routes.applicationGuildCommands(APPLICATION_ID, guildId),
        )) as ModelDiscordCMD[]
      } catch (error) {
        logger.error(
          `Failed to get guild commands for guild ${guildId}. ${error}`,
        )
        return
      }

      logger.info(
        `Started refreshing application guild (/) commands for guild: ${guildId}, current: [${current
          .flat()
          .map((c) => c.name)
          .join(", ")}], commands: [${commands
          .flat()
          .map((c) => c.name)
          .join(", ")}]`,
      )

      try {
        logger.info("Started adding application (/) guild commands.")
        const commandsToAdd = commands.filter((c) => {
          const command = current.find((cmd) => cmd.name === c.name)
          return !command
        })
        if (commandsToAdd.length > 0) {
          const resp = await fetch(
            `https://discord.com/api/v9/applications/${APPLICATION_ID}/guilds/${guildId}/commands`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bot ${DISCORD_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(commandsToAdd),
            },
          )

          const json = await resp.json()

          if (!Array.isArray(json)) {
            logger.error(
              `Failed to add application (/) guild commands for guild: ${guildId}. resp: ${json}`,
            )
            return
          }

          logger.info(
            `Successfully added application (/) guild commands for guild: ${guildId}. commands: [${commandsToAdd
              .flat()
              .map((c: SlashCommand) => c.name)
              .join(", ")}]`,
          )
        }
      } catch (err) {
        logger.error(
          `Failed to add application (/) guild commands for guild: ${guildId}. ${err}`,
        )
      }

      try {
        logger.info(
          `Started deleting application (/) guild commands for guild: ${guildId}`,
        )
        const promises = current
          .filter((cmd) => {
            const command = commands.find((c) => c.name === cmd.name)
            return command && cmd.id
          })
          .map((cmd) => {
            return new Promise<void>((resolve, reject) => {
              if (cmd.id) {
                rest
                  .delete(
                    Routes.applicationGuildCommand(
                      APPLICATION_ID,
                      guildId,
                      cmd.id,
                    ),
                  )
                  .then(() => {
                    logger.info(
                      `Deleted command ${cmd.id} ${cmd.name} from guild ${guildId}`,
                    )
                    resolve()
                  })
                  .catch((error) => {
                    reject(error)
                  })
              }
            })
          })
        await Promise.all(promises)
      } catch (error) {
        logger.error(
          `Failed to refresh application guild (/) commands for guild: ${guildId}. ${error}`,
        )
      }
    }),
  )
}

async function processGlobalCommand(globalCommands: any[]) {
  logger.info("Started refreshing application (/) global commands.")
  const current = (await rest.get(
    Routes.applicationCommands(APPLICATION_ID),
  )) as ModelDiscordCMD[]

  logger.info("Started adding application (/) global commands.")
  try {
    const resp = await fetch(
      `https://discord.com/api/v9/applications/${APPLICATION_ID}/commands`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${DISCORD_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(globalCommands),
      },
    )
    const json = await resp.json()
    // check if json is array
    if (!Array.isArray(json)) {
      console.log(json)
      logger.error(
        `Failed to add application (/) global commands. resp: ${json}`,
      )
    }
  } catch (err) {
    logger.error(`Failed to add application (/) global commands. err: ${err}`)
  }

  const promises = current
    .filter((cmd) => {
      const command = globalCommands.find((c) => c.name === cmd.name)
      return !command && cmd.id
    })
    .map((cmd) => {
      return new Promise<void>((resolve, reject) => {
        if (cmd.id) {
          rest
            .delete(Routes.applicationCommand(APPLICATION_ID, cmd.id))
            .then(() => {
              logger.info(`Deleted command ${cmd.id} ${cmd.name}`)
              resolve()
            })
            .catch((error) => {
              logger.error(
                `Failed to delete command ${cmd.id} ${cmd.name}. ${error}`,
              )
              reject(error)
            })
        }
      })
    })
  await Promise.all(promises)

  logger.info(
    `Successfully reloaded application (/) global commands. commands: [${globalCommands
      .flat()
      .map((c) => c.name)
      .join(", ")}]`,
  )
}
