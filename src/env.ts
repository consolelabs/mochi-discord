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

export const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || "932579148608729118"
export const MOCHI_GUILD_ID = process.env.MOCHI_GUILD_ID || "962589711841525780"
export const GAME_TESTSITE_CHANNEL_IDS = process.env
  .GAME_TESTSITE_CHANNEL_IDS || [
  "984660970624409630",
  "884726476900036628",
  "999889538900054046",
  "999889679761543269",
  "999889740520235008",
  "999889800091926609",
  "1000323079156805732",
]
export const DISCORD_DEFAULT_AVATAR = process.env.DISCORD_DEFAULT_AVATAR || ""
export const WEBSITE_ENDPOINT = process.env.WEBSITE_ENDPOINT || ""
export const FIRESTORE_KEY = process.env.FIRESTORE_KEY
