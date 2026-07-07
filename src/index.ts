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
import { fetchCommandPermissions } from "utils/commands"

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
    fetchCommandPermissions()
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
      sanitizeEmojis()
    }
  } catch (e) {}
}

// Unicode stand-ins for emoji codes whose custom emoji was deleted. Codes not
// listed here fall back to a neutral dot. Audited 2026-07-07: 186 of 489
// product-metadata emojis point at deleted guild emojis; 29 of those were used
// on buttons, where ONE dead emoji.id makes Discord 400 the whole reply
// (50035) -- that is what took /bal down.
const EMOJI_FALLBACKS: Record<string, string> = {
  ANIMATED_ARROW_DOWN: "🔽",
  ANIMATED_ARROW_UP: "🔼",
  ANIMATED_BADGE_1: "🏅",
  ANIMATED_BELL: "🔔",
  ANIMATED_CHAT: "💬",
  ANIMATED_CHEST: "🧰",
  ANIMATED_COIN_1: "🪙",
  ANIMATED_COIN_2: "🪙",
  ANIMATED_COIN_3: "🪙",
  ANIMATED_CROWN: "👑",
  ANIMATED_DIAMOND: "💎",
  ANIMATED_FIRE: "🔥",
  ANIMATED_FLASH: "⚡",
  ANIMATED_GEM: "💎",
  ANIMATED_HEART: "❤️",
  ANIMATED_IDEA: "💡",
  ANIMATED_MAIL_RECEIVE: "📩",
  ANIMATED_MAIL_SEND: "📨",
  ANIMATED_MONEY: "💸",
  ANIMATED_OPEN_VAULT: "🏦",
  ANIMATED_PARTY_POPPER: "🎉",
  ANIMATED_POINTING_DOWN: "👇",
  ANIMATED_POINTING_RIGHT: "👉",
  ANIMATED_QUESTION_MARK: "❓",
  ANIMATED_ROBOT: "🤖",
  ANIMATED_SHRUGGING: "🤷",
  ANIMATED_STAR: "⭐",
  ANIMATED_TOKEN_ADD: "📥",
  ANIMATED_TROPHY: "🏆",
  ANIMATED_VAULT: "🏦",
  ANIMATED_VAULT_KEY: "🔑",
  ANIMATED_WITHDRAW: "📤",
  ANIMATED_XP: "✨",
  APPROVE: "✅",
  APPROVE_GREY: "☑️",
  ARROW_DOWN: "↘️",
  ARROW_UP: "↗️",
  BELL: "🔔",
  BIN: "🗑️",
  BINANCE: "🟡",
  CASH: "💵",
  CHART: "📊",
  CHECK: "✅",
  CONFIG: "⚙️",
  GIFT: "🎁",
  LEAF: "🍃",
  MAG: "🔍",
  MOCHI_CIRCLE: "🍡",
  MONEY: "💰",
  NFT2: "🖼️",
  NFTS: "🖼️",
  PLUS: "➕",
  PROPOSAL: "📜",
  QRCODE: "🔳",
  REVOKE: "⛔",
  SHARE: "💸",
  SWAP_ROUTE: "🔁",
  WALLET: "👛",
  WALLET_1: "👛",
  WALLET_2: "👛",
  // codes MISSING from product-metadata entirely (not just dead): every miss
  // used to hit getEmoji's fallback, so e.g. numbered wallet rows rendered as
  // a dead coin. NUM_2 is the only digit the DB actually has.
  NUM_0: "0️⃣",
  NUM_1: "1️⃣",
  NUM_2: "2️⃣",
  NUM_3: "3️⃣",
  NUM_4: "4️⃣",
  NUM_5: "5️⃣",
  NUM_6: "6️⃣",
  NUM_7: "7️⃣",
  NUM_8: "8️⃣",
  NUM_9: "9️⃣",
  LINE: "▬",
  BLANK: "⠀",
  REPLY: "↳",
  REPLY_2: "↳",
  REPLY_3: "↳",
  MAIL: "📧",
  NEWS: "📰",
  TWITTER: "🐦",
  SWAP: "🔁",
  CONVERSION: "🔄",
  WEB: "🌐",
  NFT: "🖼️",
}
const NEUTRAL_EMOJI = "🔹"

// Codes forced to unicode even when their custom emoji looks valid in the
// bot's cache: users reported digit rows still rendering as ":icon:" while
// the cache said the ids were fine, and a keycap carries the same meaning
// with zero dependency on emoji inventory.
const FORCE_UNICODE = new Set([
  "NUM_0",
  "NUM_1",
  "NUM_2",
  "NUM_3",
  "NUM_4",
  "NUM_5",
  "NUM_6",
  "NUM_7",
  "NUM_8",
  "NUM_9",
])

// Replace fetched emojis whose custom-emoji id the bot can no longer access
// (deleted emoji / kicked guild) with a unicode fallback, and register
// fallbacks for well-known codes the DB does not have at all. Runs after every
// fetch and once on ready (guild emoji caches must be populated to judge).
export function sanitizeEmojis() {
  if (!client.isReady() || !emojis?.size) return
  let replaced = 0
  for (const [code, d] of emojis as Map<string, any>) {
    const match = /^<a?:[^:]+:(\d+)>$/.exec((d?.emoji ?? "").trim())
    if (!match) continue
    if (!FORCE_UNICODE.has(code) && client.emojis.cache.has(match[1])) continue
    d.emoji = EMOJI_FALLBACKS[code] ?? NEUTRAL_EMOJI
    replaced++
  }
  let added = 0
  for (const [code, emoji] of Object.entries(EMOJI_FALLBACKS)) {
    if (emojis.has(code)) continue
    emojis.set(code, { code, emoji })
    added++
  }
  if (replaced || added) {
    logger.info(
      `[sanitizeEmojis] replaced ${replaced} dead custom emojis, added ${added} missing codes (unicode fallbacks)`,
    )
  }
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
