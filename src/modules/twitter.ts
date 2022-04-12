import {
  API_SERVER_HOST,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_TOKEN_SECRET,
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
} from "../env"
import Twit from "twit"
import { logger } from "../logger"
import fetch from "node-fetch"
// import fs from "fs"
import Discord from "discord.js"

const twitterLinkReg = new RegExp(
  "http(?:s)?://(?:www.)?twitter.com/([a-zA-Z0-9_]+)/status/([a-zA-Z0-9_]+)",
  "g"
)

const twitterProfileReg = new RegExp(
  "http(?:s)?://(?:www.)?twitter.com/([a-zA-Z0-9_]+)",
  "g"
)

const twitterHandleReg = new RegExp("^(@|/)?([a-z0-9_]{1,15})$", "i")

class Twitter {
  private t
  constructor() {
    this.t = new Twit({
      consumer_key: TWITTER_CONSUMER_KEY,
      consumer_secret: TWITTER_CONSUMER_SECRET,
      access_token: TWITTER_ACCESS_TOKEN,
      access_token_secret: TWITTER_ACCESS_TOKEN_SECRET,
      timeout_ms: 60 * 1000,
      strictSSL: true,
    })
  }

  private tweet(params: Twit.Params) {
    this.t.post("statuses/update", params, (err, data, response) => {
      if (err) {
        logger.error(`error tweeting: ${err}`)
        return
      }

      // remove file
      logger.info(`tweeted: ${params.status}`)
    })
  }

  public parseTwitterHandle(msg: string) {
    return msg.match(twitterHandleReg)?.[0]
  }

  public async handleSharedLink(msg: Discord.Message) {
    const msgContent = msg.content?.toLowerCase()
    if (!twitterLinkReg.test(msgContent)) {
      return
    }

    const [link] = msgContent.match(twitterLinkReg)

    const body = JSON.stringify({
      discordId: msg.author.id,
      guildId: msg.guildId,
      link,
      twitterHandle: this.parseTwitterHandle(link.match(twitterProfileReg)[0]),
    })

    logger.info(`new shared twitter link message: ${body}`)
    await fetch(API_SERVER_HOST + "/api/v1/twitter/share-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    })
  }
}

export default new Twitter()
