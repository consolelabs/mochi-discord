import dotenv from "dotenv"
dotenv.config()

export const PROD = process.env.NODE_ENV === "production"
export const PREVIEW = process.env.NODE_ENV === "preview"
export const DEV = process.env.NODE_ENV === "development"
export const TEST = process.env.NODE_ENV === "test"
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN || ""
export const APPLICATION_ID = process.env.APPLICATION_ID || ""
export const PORT = Number(process.env.PORT || "5001")
export const SENTRY_DSN = process.env.SENTRY_DSN || ""

export const API_SERVER_HOST =
  process.env.API_SERVER_HOST || "http://localhost:8200"

export const PT_API_SERVER_HOST =
  process.env.PT_API_SERVER_HOST || "https://backend.pod.so"

export const INDEXER_API_SERVER_HOST =
  process.env.INDEXER_API_SERVER_HOST || "https://api.indexer.console.so"

// these are category ids (category = a group of channels), not channel ids
const LOCAL_EXPERIMENTAL_CATEGORY_ID =
  process.env.LOCAL_EXPERIMENTAL_CATEGORY_ID || ""
export const EXPERIMENTAL_CATEGORY_CHANNEL_IDS = [
  // pod office
  "886545596222156841",
  // mochi projects
  "904331724970926120",
  ...(LOCAL_EXPERIMENTAL_CATEGORY_ID ? [LOCAL_EXPERIMENTAL_CATEGORY_ID] : []),
]

export const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || "932579148608729118"
export const ALERT_CHANNEL_ID =
  process.env.ALERT_CHANNEL_ID || "1003709369973735535"
export const SALE_CHANNEL_ID =
  process.env.SALE_CHANNEL_ID || "1002254978360025149"
export const PROPOSAL_INTERNAL_CHANNEL_ID =
  process.env.PROPOSAL_INTERNAL_CHANNEL_ID || "1077425424218464366"
export const MOCHI_GUILD_ID = process.env.MOCHI_GUILD_ID || "962589711841525780"
export const DISCORD_DEFAULT_AVATAR = process.env.DISCORD_DEFAULT_AVATAR || ""
export const FIRESTORE_KEY = process.env.FIRESTORE_KEY || ""

export const USAGE_TRACKING_CHANNEL_ID =
  process.env.USAGE_TRACKING_CHANNEL_ID || "1083591476753211492"
export const CONSOLE_LAB_GUILD_ID =
  process.env.CONSOLE_LAB_GUILD_ID || "891310117658705931"

export const WHITE_LIST_PUBLIC_CHANGELOG = [
  "151497832853929986",
  "567326528216760320",
  "1007496699511570503",
]

export const MARKETPLACE_BASE_URL =
  process.env.MARKETPLACE_BASE_URL || "https://rarepepe.gg"

export const FEEDBACK_PUBLIC_CHANNEL_ID =
  process.env.FEEDBACK_PUBLIC_CHANNEL_ID || ""

// kafka envs
export const KAFKA_BROKERS = process.env.KAFKA_BROKERS || "localhost:9092"
export const KAFKA_TOPIC = process.env.KAFKA_TOPIC || "testTopic"
export const KAFKA_ACTIVITY_PROFILE_TOPIC =
  process.env.KAFKA_ACTIVITY_PROFILE_TOPIC || "testTopic"
export const KAFKA_ANALYTIC_TOPIC =
  process.env.KAFKA_ANALYTIC_TOPIC || "testTopic"
export const KAFKA_NOTIFICATION_TOPIC =
  process.env.KAFKA_NOTIFICATION_TOPIC || "testTopic"
export const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "mochiDiscord"
export const KAFKA_PRODUCER_TOPIC =
  process.env.KAFKA_PRODUCER_TOPIC || "mochiDiscord.dev"
export const KAFKA_AUDIT_TOPIC = process.env.KAFKA_AUDIT_TOPIC || "testTopic"

export const FTMSCAN_API_KEY = process.env.FTMSCAN_API_KEY || ""

export const MOCHI_PROFILE_API_SERVER_HOST =
  process.env.MOCHI_PROFILE_API_SERVER_HOST ||
  "https://api.mochi-profile.console.so"

export const MOCHI_PROFILE_API_SERVER_HOST_PUBLIC =
  process.env.MOCHI_PROFILE_API_SERVER_HOST_PUBLIC ||
  "https://api.mochi-profile.console.so"

export const MOCHI_PAY_API_SERVER_HOST =
  process.env.MOCHI_PAY_API_SERVER_HOST || "https://api.mochi-pay.console.so"

export const MOCHI_TELEGRAM_API_SERVER_HOST =
  process.env.MOCHI_TELEGRAM_API_SERVER_HOST ||
  "https://api.mochi-telegram.console.so"

export const GAME_STORE_API_SERVER_HOST =
  process.env.GAME_STORE_API_SERVER_HOST || "https://game-store-api.console.so"

export const ECOCAL_API_SERVER_HOST = process.env.ECOCAL_API_SERVER_HOST || ""

export const MOCHI_API_KEY = process.env.MOCHI_API_KEY || ""
export const KRYSTAL_ACCESS_TOKEN = process.env.KRYSTAL_ACCESS_TOKEN || ""
export const ECOCAL_API_KEY = process.env.ECOCAL_API_KEY || ""

export const FETCH_TIMEOUT_SECONDS = process.env.FETCH_TIMEOUT_SECONDS || 5
export const CACHE_TTL_SECONDS = process.env.CACHE_TTL_SECONDS || 1800
export const REDIS_HOST = process.env.REDIS_HOST || "localhost:6379"
export const REDIS_DB = process.env.REDIS_DB || "0"
export const REDIS_MASTER_NAME = process.env.REDIS_MASTER_NAME || ""

export const MOCHI_GUESS_API_KEY = process.env.MOCHI_GUESS_API_KEY || ""
export const MOCHI_GUESS_API_HOST = process.env.MOCHI_GUESS_API_HOST || ""
export const MOCHI_BOT_SECRET = process.env.MOCHI_BOT_SECRET || ""
export const ICY_API_HOST = "https://api.icy.so"

export const UNLEASH_SERVER_HOST =
  process.env.UNLEASH_SERVER_HOST || "http://localhost:4242"
export const UNLEASH_PAT_TOKEN = process.env.UNLEASH_PAT_TOKEN || ""
export const UNLEASH_API_TOKEN = process.env.UNLEASH_API_TOKEN || ""
export const UNLEASH_PROJECT = process.env.UNLEASH_PROJECT || "default"

export const MOCHI_APP_PRIVATE_KEY = process.env.MOCHI_APP_PRIVATE_KEY || ""
