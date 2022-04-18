import dotenv from "dotenv"
if (process.env.JEST_WORKER_ID !== undefined) {
  dotenv.config({ path: process.cwd() + "/.env.test" })
} else {
  dotenv.config()
}

export const ENV = process.env.ENV || ""
export const PROD = process.env.NODE_ENV === "production"
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN
export const DISCORD_BOT_GUILD_ID = process.env.DISCORD_BOT_GUILD_ID || ""
export const DISCORD_ADMIN_GROUP = process.env.DISCORD_ADMIN_GROUP || ""

export const DISCORD_GM_CHANNEL = process.env.DISCORD_GM_CHANNEL || ""

export const RPC_PROVIDER_URL = process.env.RPC_PROVIDER_URL || ""
export const PRIVATE_KEY = process.env.PRIVATE_KEY || ""

export const API_SERVER_HOST =
  process.env.API_SERVER_HOST || "http://localhost:8200"

export const TATSU_API_KEY =
  process.env.TATSU_API_KEY || "3NSksWTLfb-FRLGNQq4T8r0DO2mcV8BNw"

export const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || "932579148608729118"
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || ""
export const NEKO_SECRET = process.env.NEKO_SECRET || ""
