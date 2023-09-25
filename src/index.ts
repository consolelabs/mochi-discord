/* eslint-disable @typescript-eslint/ban-ts-comment */
import Discord from "discord.js"
import { API_SERVER_HOST, APPLICATION_ID, DISCORD_TOKEN, PORT } from "./env"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { logger } from "logger"
import { slashCommands } from "commands"
import { createServer, Server, IncomingMessage, ServerResponse } from "http"
import { assignKafka } from "queue/kafka/queue"
import { run } from "queue/kafka/producer"
import { IS_READY } from "listeners/discord/ready"
import events from "listeners/discord"
import { getTipsAndFacts } from "cache/tip-fact-cache"

export let emojis = new Map()

let server: Server | null = null

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

// register slash commands
const body = Object.entries(slashCommands ?? {}).map((e) =>
  e[1].prepare(e[0]).toJSON(),
)
const rest = new REST({ version: "9" }).setToken(DISCORD_TOKEN)
;(async () => {
  try {
    logger.info("Started refreshing application (/) commands.")
    await rest.put(Routes.applicationCommands(APPLICATION_ID), {
      body,
    })
    logger.info("Successfully reloaded application (/) commands.")

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
