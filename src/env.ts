import dotenv from "dotenv"
if (process.env.JEST_WORKER_ID !== undefined) {
  dotenv.config({ path: process.cwd() + "/.env.test" })
} else {
  dotenv.config()
}

export const PROD = process.env.NODE_ENV === "production"
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN
export const DISCORD_BOT_MINT_CHANNEL =
  process.env.DISCORD_BOT_MINT_CHANNEL || ""
export const DISCORD_BOT_GUILD_ID = process.env.DISCORD_BOT_GUILD_ID || ""
export const DISCORD_ADMIN_GROUP = process.env.DISCORD_ADMIN_GROUP || ""
export const DISCORD_POD_TOGETHER_ROLE_ID =
  process.env.DISCORD_POD_TOGETHER_ROLE_ID || ""

export const DISCORD_AMPAWSSADOR_CHANNEL =
  process.env.DISCORD_AMPAWSSADOR_CHANNEL || ""
export const DISCORD_ENROLL_AMPAWSSADOR_CHANNEL =
  process.env.DISCORD_ENROLL_AMPAWSSADOR_CHANNEL || "942116661568372826"
export const DISCORD_ALPHA_CHANNEL = process.env.DISCORD_ALPHA_CHANNEL || ""
export const DISCORD_ENROLL_ALPHA_CHANNEL =
  process.env.DISCORD_ENROLL_ALPHA_CHANNEL || "942113663790243940"
export const DISCORD_GM_CHANNEL = process.env.DISCORD_GM_CHANNEL || ""

export const RPC_PROVIDER_URL = process.env.RPC_PROVIDER_URL || ""
export const PRIVATE_KEY = process.env.PRIVATE_KEY || ""

export const TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY || ""
export const TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET || ""
export const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || ""
export const TWITTER_ACCESS_TOKEN_SECRET =
  process.env.TWITTER_ACCESS_TOKEN_SECRET || ""

export const ENV = process.env.ENV || ""

export const API_SERVER_HOST =
  process.env.API_SERVER_HOST ||
  "https://backend.pod.so" ||
  "http://localhost:8100"
export const PROCESSOR_API_SERVER_HOST =
  process.env.PROCESSOR_API_SERVER_HOST || "http://localhost:4000"

export const PREFIX = "$"
export const ADMIN_PREFIX = "p@"
export const HELP_CMD = `${PREFIX}help`
export const ADMIN_HELP_CMD = `${ADMIN_PREFIX}help`

export const PROFILE_THUMBNAIL =
  "https://cdn.discordapp.com/emojis/916737804384485447.png?size=240"
export const TATSU_API_KEY =
  process.env.TATSU_API_KEY || "3NSksWTLfb-FRLGNQq4T8r0DO2mcV8BNw"

export const SOCIAL_COLOR = "#FBCB2D"

export const DOT = "•"
export const VERTICAL_BAR = "|"
export const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || "932579148608729118"
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || ""
export const NEKO_SECRET = process.env.NEKO_SECRET || ""
