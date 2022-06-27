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
export const GAME_TESTSITE_CHANNEL_ID = "884726476900036628"
export const DISCORD_DEFAULT_AVATAR = process.env.DISCORD_DEFAULT_AVATAR || ""
export const WEBSITE_ENDPOINT = process.env.WEBSITE_ENDPOINT || ""
