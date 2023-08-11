import Formatter, { utils } from "@consolelabs/mochi-formatter"
import Redis from "ioredis"
import { REDIS_DB, REDIS_HOST } from "env"
import { MOCHI_PROFILE_API_BASE_URL } from "./constants"

Formatter.profileApi = MOCHI_PROFILE_API_BASE_URL

const redis = new Redis(`redis://${REDIS_HOST}/${REDIS_DB}`)
Formatter.redis = redis
export { Formatter as fmt, utils }
