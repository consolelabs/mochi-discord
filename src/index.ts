/* eslint-disable @typescript-eslint/ban-ts-comment */
import Discord from "discord.js"
import { API_SERVER_HOST, DEV, DISCORD_TOKEN, PORT } from "./env"
import { REST } from "@discordjs/rest"
import { logger } from "logger"
import { slashCommands } from "commands"
import { createServer, Server, IncomingMessage, ServerResponse } from "http"
import { assignKafka } from "queue/kafka/queue"
import { run } from "queue/kafka/producer"
import { IS_READY } from "listeners/discord/ready"
import events from "listeners/discord"
import { getTipsAndFacts } from "cache/tip-fact-cache"
import { registerCommand, syncCommands } from "utils/slash-command"
import { appName, initUnleash, unleash } from "adapters/unleash/unleash"
import { isEqual } from "lodash"
import { PRODUCT_NAME } from "utils/constants"
import { Sentry } from "sentry"
import { version } from "../package.json"

export { slashCommands }

export let emojis = new Map()

let server: Server | null = null
let featureData: Record<string, FeatureData>[] = []

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.GUILD_INVITES,
    Discord.Intents.FLAGS.GUILD_PRESENCES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
  ],
  partials: ["MESSAGE", "REACTION", "CHANNEL"],
})

// discord client
for (const e of events) {
  if (e.once) {
    client.once(e.name, e.execute as any)
  } else {
    client.on(e.name, e.execute as any)
  }
}

client.login(DISCORD_TOKEN)

process.on("SIGTERM", () => {
  process.exit(0)
})

// Prevent app crashing
process.on("uncaughtException", (error, origin) => {
  logger.info("----- Uncaught exception -----")
  logger.info(error)
  logger.info("----- Exception origin -----")
  logger.info(origin)
})

process.on("unhandledRejection", (reason, promise) => {
  logger.info("----- Unhandled Rejection at -----")
  logger.info(promise)
  logger.info("----- Reason -----")
  logger.info(reason)
})

// register slash commands
const body = Object.entries(slashCommands ?? {}).map((e) =>
  e[1].prepare(e[0]).toJSON(),
)
const rest = new REST({ version: "9" }).setToken(DISCORD_TOKEN)
;(async () => {
  try {
    if (DEV) {
      await registerCommand()
    } else {
      await initUnleash()
      unleash.on("changed", (stream: any) => {
        if (!unleash.isEnabled(`${appName}.discord.cmd.unleash_on_changed`)) {
          return
        }

        let changed = false
        try {
          stream.forEach((feature: any) => {
            if (
              typeof feature.name !== "string" ||
              !feature.name.includes(appName)
            ) {
              return
            }

            // if feature data is empty, it means that onchange is triggered by the first time
            if (featureData.length === 0) {
              changed = true
            }

            // assign feature data if feature data is empty to store featureData's stage
            if (!featureData[feature.name]) {
              featureData[feature.name] = feature
              return
            }

            if (!isEqual(featureData[feature.name], feature)) {
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
            .then(() => {
              logger.info("Unleash toggles synced")
            })
            .catch((e) => {
              e.name = `${PRODUCT_NAME}: syncCommands ⎯  ${e.name}`
              Sentry.captureException(e, {
                extra: {
                  version: `v${version}`,
                },
              })
            })
        } else {
          logger.info("Unleash toggles not changed")
        }
      })
    }

    logger.info("Getting tips and facts.")
    await getTipsAndFacts()
    logger.info("Success getting tips and facts.")

    logger.info("Init Mochi API")
    logger.info("Success init Mochi API")

    runHttpServer()
    fetchEmojis()
  } catch (error) {
    logger.error(`Failed to refresh application (/) commands. ${error}`)
  }
})()
;(async () => {
  try {
    logger.info("Connecting to Kafka.")
    // start queue
    assignKafka(await run())
    logger.info("Successfully connected to Kafka.")
  } catch (error) {
    logger.error("Failed to connect to Kafka.")
  }
})()

function runHttpServer() {
  server = createServer(
    (request: IncomingMessage, response: ServerResponse) => {
      if (request.url === "/healthz") {
        if (IS_READY) {
          response.statusCode = 200
          response.setHeader("Content-Type", "text/plain")
          response.end("OK")
          return
        }

        response.statusCode = 503
        response.end()
        return
      }

      response.statusCode = 404
      response.end()
    },
  )

  server.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`)
  })
}

export async function fetchEmojis() {
  try {
    const res = await fetch(
      `${API_SERVER_HOST}/api/v1/product-metadata/emoji?size=1000`,
    )
    const json = await res.json()
    const data = json.data
    if (data) {
      emojis = new Map(data.map((d: any) => [d.code.toUpperCase(), d]))
    }
  } catch (e) {}
}

// cleanup
// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.on("vite:beforeFullReload", async () => {
    server?.close()

    for (const e of events) {
      client.off(e.name, e.execute as any)
    }
  })
}

export default client
