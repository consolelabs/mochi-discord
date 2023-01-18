import { TWITTER_TOKEN } from "env"
import { Client } from "twitter-api-sdk"

const twitter = new Client(TWITTER_TOKEN)

export { twitter }
