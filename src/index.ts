/* eslint-disable @typescript-eslint/ban-ts-comment */
import Discord, { CommandInteraction } from "discord.js"
import {
  APPLICATION_ID,
  DISCORD_TOKEN,
  PORT,
  REDIS_DB,
  REDIS_HOST,
} from "./env"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { logger } from "logger"
import { slashCommands } from "commands"
import { createServer, Server, IncomingMessage, ServerResponse } from "http"
import { assignKafka } from "queue/kafka/queue"
import { run } from "queue/kafka/producer"
import { IS_READY } from "listeners/discord/ready"
import UI from "@consolelabs/mochi-ui"
import Redis from "ioredis"
import events from "listeners/discord"
import { getTipsAndFacts } from "cache/tip-fact-cache"
import api from "api"
import { DOT } from "utils/constants"
import { getEmbedFooter } from "ui/discord/embed"

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
    const redis = new Redis(`redis://${REDIS_HOST}/${REDIS_DB}`)
    await api.init()
    UI.api = api
    UI.redis = redis
    logger.info("Success init Mochi API")

    runHttpServer()
  } catch (error) {
    logger.error("Failed to refresh application (/) commands.")
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

// monkeypatch
const editReply = CommandInteraction.prototype.editReply
CommandInteraction.prototype.editReply = async function (
  ...args: Parameters<typeof editReply>
) {
  const [payload] = args
  if (typeof payload === "string" || !("embeds" in payload))
    return editReply.apply(this, args)

  const { ok: okProfile, data: profile } = await api.profile.discord.getById({
    discordId: this.user.id,
  })
  if (okProfile) {
    const { changelog } = await api.getLatestChangelog(profile.id)
    if (changelog) {
      const embed = payload.embeds?.at(0)
      if (embed) {
        const parts = embed.footer?.text?.split(` ${DOT} `)
        if (parts?.length) {
          parts[0] = "🌈 Mochi has a new update, check out /sup"
          embed.footer!.text = getEmbedFooter(parts)
        }
      }
    }
  }

  return editReply.apply(this, args)
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
