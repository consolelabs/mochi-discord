import {
  TWITTER_ACCESS_TOKEN,
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_TOKEN,
  TWITTER_TOKEN_SECRET,
} from "env"
import { Client } from "twitter-api-sdk"
import { TwitterApi } from "twitter-api-v2"

const twitterAppClient = new Client(TWITTER_TOKEN)

let twitterUserClient: TwitterApi | null
const hasCreds =
  TWITTER_CONSUMER_KEY &&
  TWITTER_CONSUMER_SECRET &&
  TWITTER_ACCESS_TOKEN &&
  TWITTER_TOKEN_SECRET
if (hasCreds) {
  twitterUserClient = new TwitterApi({
    appKey: TWITTER_CONSUMER_KEY,
    appSecret: TWITTER_CONSUMER_SECRET,
    accessToken: TWITTER_ACCESS_TOKEN,
    accessSecret: TWITTER_TOKEN_SECRET,
  })
}

export { twitterAppClient, twitterUserClient }
