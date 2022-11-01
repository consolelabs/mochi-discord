import apiConfig from "adapters/config"
import { Client, TextChannel } from "discord.js"
import { InmemoryStorage } from "types/InmemoryStorage"
import { twitter } from "utils/twitter-api"
import { logger } from "logger"
import { PROD } from "env"
import { PartialDeep } from "type-fest"
import config from "adapters/config"
import { APIError } from "errors"

type UpsertRuleParams = {
  ruleValue: string[]
  channelId: string
  guildId: string
  ruleId?: string
}

type RemoveRuleParams = {
  ruleId: string
  channelId: string
}

type Tweet = {
  data: { author_id: string; id: string; entities: { mentions: Array<any> } }
  includes: { users: Array<{ id: string; username: string }> }
  matching_rules: Array<{ id: string }>
  errors: Array<{
    title: string
    disconnect_type: string
    detail: string
    type: string
  }>
}

type ProcessParam = {
  channel: TextChannel
  handle: string
  tweet: Tweet
}

const MENTION_LIMIT = 7

function toTwitterRuleFormat(keywords: Array<string>) {
  return `(${keywords.filter(Boolean).join(" OR ")}) -is:retweet -is:reply`
}

class TwitterStream extends InmemoryStorage {
  private publishChannelsByRuleId: Record<string, Set<string>> = {}
  private _client: Client | null = null

  constructor() {
    super()
    this.up()
  }

  set client(c: Client) {
    if (this._client?.isReady) return
    this._client = c
    this.watchStream()
  }

  private async sendToChannel({ channel, handle, tweet }: ProcessParam) {
    try {
      await channel.send(
        `https://twitter.com/${handle}/status/${tweet.data?.id}`
      )
      logger.info(
        `[TwitterStream]: tweet ${tweet.data?.id} of ${handle} sent to channel`
      )
    } catch (e) {
      logger.error(`[TwitterStream] - error in sendToChannel ${e}`)
    }
  }

  private async logToDB({ channel, tweet, handle }: ProcessParam) {
    try {
      await apiConfig.logTweet({
        guild_id: channel.guildId,
        tweet_id: tweet.data?.id,
        twitter_id: tweet.data?.author_id,
        twitter_handle: handle,
      })
      logger.info(
        `[TwitterStream]: tweet ${tweet.data?.id} of ${handle} logged to db`
      )
    } catch (e) {
      logger.error(`[TwitterStream] - error in logToDB ${e}`)
    }
  }

  private async process(data: ProcessParam) {
    Promise.all([this.sendToChannel(data), this.logToDB(data)])
      .then(() => {
        logger.info(
          `[TwitterStream]: tweet ${data.tweet.data?.id} of ${data.handle} processed`
        )
      })
      .catch((e) => {
        logger.error(`[TwitterStream] - error in process ${e}`)
      })
  }

  private async isAuthorBlacklisted(
    guildId: string,
    twitterId: string | undefined
  ) {
    if (!twitterId) return true
    const {
      data: blacklist,
      ok,
      curl,
      log,
    } = await config.getTwitterBlackList(guildId)
    if (!ok) {
      throw new APIError({ curl, description: log })
    }
    const blocked = blacklist.find((item: any) => item.twitter_id === twitterId)
    return !!blocked
  }

  private async handle(tweet: PartialDeep<Tweet>) {
    if (tweet.errors?.length) {
      logger.error(
        `[TwitterStream]: stream connection error detected ${JSON.stringify(
          tweet.errors
        )}`
      )
      return
    }
    if (
      tweet.data?.entities?.mentions &&
      Array.isArray(tweet.data.entities.mentions) &&
      tweet.data.entities.mentions.length >= MENTION_LIMIT
    ) {
      logger.info(
        `[TwitterStream]: tweet skipped because of >= ${MENTION_LIMIT} mentions ${tweet.data.id}`
      )
      return
    }
    logger.info(`[TwitterStream]: new tweet detected ${JSON.stringify(tweet)}`)
    try {
      const ruleIds = tweet.matching_rules?.map((mr) => mr?.id) ?? []
      const handle = tweet.includes?.users?.find(
        (u) => u?.id === tweet.data?.author_id
      )?.username
      if (ruleIds.length === 0 || !handle || !tweet.data?.id) return
      logger.info(`[TwitterStream]: handling tweet ${tweet.data?.id}`)
      const publishChannels = []
      for (const ruleId of ruleIds) {
        if (ruleId && this.publishChannelsByRuleId[ruleId]) {
          publishChannels.push(this.publishChannelsByRuleId[ruleId])
        }
      }

      publishChannels.forEach((channelIds) => {
        channelIds.forEach((channelId) => {
          this._client?.channels.fetch(channelId).then(async (channel) => {
            // `channel` should be TextChannel, if not then it's probably removed -> warn
            if (channel?.isText() && channel instanceof TextChannel) {
              const guildId = (channel as TextChannel).guild.id
              const isBlocked = await this.isAuthorBlacklisted(
                guildId,
                tweet.data?.author_id
              )
              if (isBlocked) {
                logger.info(
                  `[TwitterStream]: User ${tweet.data?.author_id} has already been blocked`
                )
                return
              }
              this.process({ channel, tweet: tweet as Tweet, handle })
            } else if (!channel) {
              logger.warn(
                `[TwitterStream]: matched tweet id ${tweet.data?.id} but unable to process due to removed channel id ${channelId}`
              )
            } else {
              logger.warn(
                `[TwitterStream]: matched tweet id ${tweet.data?.id} but unable to process due to channel not type text ${channel?.id}`
              )
            }
          })
        })
      })
    } catch (e) {
      logger.error(`[TwitterStream] - error in handle ${e}`)
    }
  }

  private async watchStream() {
    try {
      const stream = twitter.tweets.searchStream({
        expansions: ["author_id"],
      })
      for await (const tweet of stream) {
        this.handle(tweet)
      }
    } catch (e) {
      logger.error(
        `[TwitterStream] - error in watchStream ${JSON.stringify(e)}`
      )
    }
  }

  /*
   * For detail on how to build a rule, see
   * https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/integrate/build-a-rule
   */
  async upsertRule(params: UpsertRuleParams) {
    try {
      let ruleId = params.ruleId
      // if there is a ruleId, it means that we are updating a current rule -> need to call twitter API
      // or else we will be listening to stale rules in the same guild
      const rule = await twitter.tweets.addOrDeleteRules({
        add: [
          {
            value: toTwitterRuleFormat(params.ruleValue),
          },
        ],
      })
      if (rule.errors?.[0]?.title === "DuplicateRule") {
        ruleId = (rule.errors?.[0] as { id?: string }).id
      } else {
        ruleId = rule.data?.[0]?.id
      }
      if (ruleId) {
        const publishChannels =
          this.publishChannelsByRuleId[ruleId] ?? new Set()
        publishChannels.add(params.channelId)
        this.publishChannelsByRuleId[ruleId] = publishChannels
      }
      return ruleId
    } catch (e) {
      logger.error(`[TwitterStream] - error in upsertRule ${e}`)
    }
  }

  async removeRule(params: RemoveRuleParams) {
    await twitter.tweets.addOrDeleteRules({
      delete: {
        ids: [params.ruleId],
      },
    })
    const set = this.publishChannelsByRuleId[params.ruleId]
    if (!set) return
    set.delete(params.channelId)
  }

  protected async up() {
    logger.info("[TwitterStream] - backend retrieving data...")
    try {
      if (PROD) {
        const allRules = await twitter.tweets.getRules()
        const allRuleIds =
          allRules.data?.filter((r) => r.id).map((r) => r.id ?? "") ?? []
        const allTwitterConfig = await apiConfig.getTwitterConfig()
        if (allTwitterConfig.ok) {
          const promises = allTwitterConfig.data.map(
            async (config: {
              rule_id: string
              channel_id: string
              guild_id: string
              user_id: string
              hashtag: Array<string>
              from_twitter: Array<string>
              twitter_username: Array<string>
            }) => {
              const newRuleId = await this.upsertRule({
                ruleValue: [
                  ...config.hashtag,
                  ...config.twitter_username,
                  ...config.from_twitter,
                ],
                guildId: config.guild_id,
                channelId: config.channel_id,
                ruleId: config.rule_id,
              })
              if (newRuleId) {
                await apiConfig.setTwitterConfig({
                  ...config,
                  rule_id: newRuleId,
                })
              }

              return newRuleId
            }
          )
          const validRuleIds = await Promise.all(promises)
          const staleRuleIds = allRuleIds
            .filter(Boolean)
            .filter((rid) => !validRuleIds.some((vrid) => vrid === rid))
          if (staleRuleIds.length > 0) {
            await twitter.tweets.addOrDeleteRules({
              delete: {
                ids: staleRuleIds,
              },
            })
          }
        }
      }
      logger.info("[TwitterStream] - backend retrieving data OK")
    } catch (e) {
      logger.error("[TwitterStream] - error in Twitter")
    }
  }
}

export default new TwitterStream()
