import Discord from "discord.js"
import { APPLICATION_ID, DISCORD_TOKEN, PORT } from "./env"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { logger } from "logger"
import { slashCommands } from "commands"
import { createServer, Server, IncomingMessage, ServerResponse } from "http"
import kafka from "queue/kafka"
import { IS_READY } from "listeners/discord/ready"
import events from "listeners/discord"
import { getTipsAndFacts } from "cache/tip-fact-cache"

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
  e[1].prepare(e[0]).toJSON()
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

    runHttpServer()

    kafka.init()
  } catch (error) {
    logger.error("Failed to refresh application (/) commands.")
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
    }
  )

  server.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`)
  })
}

// cleanup
if (import.meta.hot) {
  import.meta.hot.on("vite:beforeFullReload", async () => {
    await new Promise<void>((r) => {
      for (const e of events) {
        client.off(e.name, e.execute as any)
      }

      server?.close(() => r())
    })
  })
}

export default client
