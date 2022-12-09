import dotenv from "dotenv"
dotenv.config()

export const PROD = process.env.NODE_ENV === "production"
export const TEST = process.env.NODE_ENV === "test"
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN || ""
export const APPLICATION_ID = process.env.APPLICATION_ID || ""
export const PORT = Number(process.env.PORT || "5001")

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

export const FEEDBACK_PUBLIC_CHANNEL_ID =
  process.env.FEEDBACK_PUBLIC_CHANNEL_ID || ""

// kafka envs
export const KAFKA_BROKERS = process.env.KAFKA_BROKERS || "localhost:9092"
export const KAFKA_TOPIC = process.env.KAFKA_TOPIC || "testTopic"
export const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "mochiDiscord"
export const KAFKA_PRODUCER_TOPIC =
  process.env.KAFKA_PRODUCER_TOPIC || "mochiDiscord.dev"
