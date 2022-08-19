import dotenv from "dotenv"
if (process.env.JEST_WORKER_ID !== undefined) {
  dotenv.config({ path: process.cwd() + "/.env.test" })
} else {
  dotenv.config()
}

export const PROD = process.env.NODE_ENV === "production"
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN

export const API_SERVER_HOST =
  process.env.API_SERVER_HOST || "http://localhost:8200"

export const PT_API_SERVER_HOST =
  process.env.PT_API_SERVER_HOST || "https://backend.pod.so"

export const INDEXER_API_SERVER_HOST =
  process.env.INDEXER_API_SERVER_HOST || "https://api.indexer.console.so"

export const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || "932579148608729118"
export const ALERT_CHANNEL_ID =
  process.env.ALERT_CHANNEL_ID || "1003709369973735535"
export const SALE_CHANNEL_ID =
  process.env.SALE_CHANNEL_ID || "1002254978360025149"
export const MOCHI_GUILD_ID = process.env.MOCHI_GUILD_ID || "962589711841525780"
export const GAME_TRIPOD_TEST_CHANNEL_ID =
  process.env.GAME_TRIPOD_TEST_CHANNEL_ID || "884726476900036628"
export const GAME_TRIPOD_CHANNEL_IDS =
  process.env.GAME_TRIPOD_CHANNEL_IDS?.split(",") || [
    "984660970624409630",
    "884726476900036628",
    "999889538900054046",
    "999889679761543269",
    "999889740520235008",
    "999889800091926609",
    "1000323079156805732",
    "811572042167222302",
    "1001084936255713350",
    "1001084976311312496",
    "1001085004014702692",
    "1001085029163749376",
  ]
export const DISCORD_DEFAULT_AVATAR = process.env.DISCORD_DEFAULT_AVATAR || ""
export const WEBSITE_ENDPOINT = process.env.WEBSITE_ENDPOINT || ""
export const FIRESTORE_KEY = process.env.FIRESTORE_KEY || ""
export const TWITTER_TOKEN = process.env.TWITTER_TOKEN || ""
export const MARKETPLACE_BASE_URL =
  process.env.MARKETPLACE_BASE_URL || "https://rarepepe.gg"
