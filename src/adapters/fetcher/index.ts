import deepmerge from "deepmerge"
import { logger } from "logger"
import fetch from "node-fetch"
import { capFirst, getEmoji } from "utils/common"
import querystring from "query-string"
import { attachAuthorization, convertToSnakeCase, makeLog } from "./utils"
import toCurl from "fetch-to-curl"
import { kafkaQueue } from "queue/kafka/queue"
import { stack } from "utils/stack-trace"

import {
  CACHE_TTL_SECONDS,
  FETCH_TIMEOUT_SECONDS,
  REDIS_HOST,
  REDIS_DB,
  REDIS_MASTER_NAME,
  TEST,
} from "env"
import {
  eventAsyncStore,
  slashCommandAsyncStore,
  textCommandAsyncStore,
} from "utils/async-storages"
import { Message } from "discord.js"
import { somethingWentWrongPayload } from "utils/error"
import { createStaleWhileRevalidateCache } from "stale-while-revalidate-cache"
import {
  ErrPayload,
  ErrResponse,
  FetchResult,
  OkPayload,
  OkResponse,
  RequestInit,
} from "./types"
import Redis from "ioredis"
import { nanoid } from "nanoid"
import { Sentry } from "sentry"
import UI from "@consolelabs/mochi-ui"
import api from "api"
import { PRODUCT_NAME } from "utils/constants"

let cacheTtlSeconds = Number(CACHE_TTL_SECONDS)
if (Number.isNaN(cacheTtlSeconds)) cacheTtlSeconds = 1800

let timeoutSeconds = Number(FETCH_TIMEOUT_SECONDS)
if (Number.isNaN(timeoutSeconds)) timeoutSeconds = 5

let redisError = false

const noop = () => Promise.resolve({})
// the one and only cache that should be used for response caching
let cache = {
  get: noop as any,
  set: noop as any,
  del: noop as any,
}

if (!TEST) {
  logger.info("Connecting to Redis...")
  let redis: Redis

  // add redis sentinel support
  if (REDIS_MASTER_NAME) {
    let sentinels = REDIS_HOST.split(",").map((s) => {
      const [host, port] = s.split(":")
      return { host, port: Number(port) }
    })
    redis = new Redis({
      name: REDIS_MASTER_NAME,
      sentinels,
      connectTimeout: 5000,
    })
  } else {
    redis = new Redis(`redis://${REDIS_HOST}/${REDIS_DB}`)
  }

  redis
    .on("ready", () => {
      logger.info(`Connect to Redis OK, url=redis://${REDIS_HOST}/${REDIS_DB}`)
      cache = redis
    })
    .on("error", (e) => {
      logger.warn(`Connect to Redis FAIL, error ${e}`)
      redisError = true
      redis.quit()
    })

  api.init().then(() => {
    UI.api = api
    UI.redis = redis
  })
}

export const swr = createStaleWhileRevalidateCache({
  maxTimeToLive: cacheTtlSeconds * 1000,
  minTimeToStale: (cacheTtlSeconds / 1.5) * 1000,
  serialize: JSON.stringify,
  deserialize: JSON.parse,
  storage: {
    async getItem(cacheKey: string) {
      return await cache.get(cacheKey)
    },
    async setItem(cacheKey: string, cacheValue: any) {
      await cache.set(cacheKey, cacheValue, "EX", cacheTtlSeconds)
    },
    async removeItem(cacheKey: string) {
      await cache.del(cacheKey)
    },
  },
})

const defaultInit: RequestInit = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
  query: {},
  queryCamelToSnake: true,
  bodyCamelToSnake: true,
  silent: false,
  isWebhook: false,
}

export class Fetcher {
  protected async jsonFetch<T>(
    url: string,
    init: RequestInit = {},
  ): FetchResult<T> {
    let mergedInit = deepmerge(defaultInit, init)
    mergedInit = deepmerge(mergedInit, {
      headers: {
        RequestId: nanoid(10),
      },
    })
    const query = this.normalizeQuery(mergedInit)
    const fullUrl = querystring.stringifyUrl(
      { url, query },
      { arrayFormat: "separator", arrayFormatSeparator: "|" },
    )

    // we only cache GET response and only if redis is connected, otherwise no cache
    if (mergedInit.method.trim().toLowerCase() === "get" && !redisError) {
      return (await this.cacheFetch<T>(fullUrl, mergedInit)) as FetchResult<T>
    } else {
      return await this.interalJsonFetch<T>(fullUrl, mergedInit)
    }
  }

  private cacheFetch<T>(fullUrl: string, init: Required<RequestInit>) {
    const cacheKey = `${init.method} ${fullUrl}`

    return new Promise((resolve) => {
      let timedout = false
      // after timeout, if there is still no response from api, use cache instead
      const useCache = setTimeout(async () => {
        timedout = true

        const { value } = await swr(
          cacheKey,
          async () => await this.interalJsonFetch<T>(fullUrl, init),
        )

        // const isFromCache = status === "fresh" || status === "stale"

        // if (value.ok) {
        //   value.cache = {
        //     status,
        //     cachedAt,
        //   }
        //
        //   if (isFromCache && !init.silent) {
        //     logger.info(
        //       makeLog({
        //         ok: true,
        //         method: init.method,
        //         status: status === "fresh" ? "cache" : "cache/revalidating",
        //         url: fullUrl,
        //       })
        //     )
        //   }
        // }

        resolve(value)
      }, timeoutSeconds * 1000)

      this.interalJsonFetch<T>(fullUrl, init).then((res) => {
        // within acceptable time -> use resposne from api
        if (!timedout) {
          // clear useCache
          clearTimeout(useCache)
          // manually update cache
          swr.persist(cacheKey, res)
          resolve(res)
        }
      })
    })
  }

  private normalizeQuery(init: Required<RequestInit>) {
    const { query: _query, queryCamelToSnake } = init
    let query: typeof _query = {}
    if (queryCamelToSnake) {
      query = convertToSnakeCase(_query)
    } else {
      query = _query
    }

    return query
  }

  private async interalJsonFetch<T>(
    url: string,
    init: Required<RequestInit>,
  ): FetchResult<T> {
    let curl = "None"
    const nekoSad = getEmoji("NEKOSAD")
    let isWebhook = false
    let status

    try {
      const {
        bodyCamelToSnake,
        body: _body,
        silent,
        isWebhook: _isWebhook,
        ...validInit
      } = init
      isWebhook = _isWebhook

      let body
      if (bodyCamelToSnake) {
        if (typeof _body === "string") {
          // for backward compability
          const data = JSON.parse(_body)
          body = JSON.stringify(convertToSnakeCase(data), null, 4)
        } else if (typeof _body === "object" && _body !== null) {
          body = JSON.stringify(convertToSnakeCase(_body), null, 4)
        }
      } else {
        if (typeof _body === "object" && _body !== null) {
          body = JSON.stringify(_body, null, 4)
        }
      }

      const options = {
        ...validInit,
        body,
      }
      attachAuthorization(url, options)
      curl = toCurl(url, options)
      const res = await fetch(url, options)

      status = res.status
      const log = makeLog({
        ok: res.ok,
        method: init.method,
        status: res.status,
        url,
        body,
      })
      if (!res.ok) {
        logger.error(log)

        if (res.status === 500) {
          const store =
            textCommandAsyncStore.getStore() ||
            slashCommandAsyncStore.getStore() ||
            eventAsyncStore.getStore()
          const message = JSON.stringify({
            ...(store ? JSON.parse(store.data) : {}),
            error: log,
            stack: TEST ? "" : stack.clean(new Error().stack ?? ""),
          })
          Sentry.captureMessage(
            `${PRODUCT_NAME}: API_CALL_500 ⎯ ${log}`,
            "fatal",
          )
          await kafkaQueue?.produceAnalyticMsg([message])

          // if the error is from webhook api, we don't want to bother user with it, just kafka log is enough
          // TODO: REFACTOR THIS
          // if (store?.msgOrInteraction && !isWebhook) {
          //   if (store.msgOrInteraction instanceof Message) {
          //     await store.msgOrInteraction.reply(somethingWentWrongPayload())
          //   } else if (!store.msgOrInteraction.isAutocomplete()) {
          //     await store.msgOrInteraction.editReply(
          //       somethingWentWrongPayload(),
          //     )
          //   }
          // }
        }

        const json = await (res as ErrResponse)
          .json()
          .catch(() => ({}) as ErrPayload)
        json.originalError = json.error
        json.error = capFirst(json.error)
        json.ok = false
        json.log = log
        json.curl = curl
        json.status = res.status
        return json
      } else {
        // OK case
        if (!silent) {
          logger.info(log)
        }
        const json = await (res as OkResponse<T>)
          .json()
          .catch(() => ({}) as OkPayload)
        json.ok = true
        json.log = log
        json.curl = curl
        json.status = res.status
        return json
      }
    } catch (e: any) {
      const log = makeLog({
        notSent: typeof status !== "number",
        ok: false,
        method: init.method,
        status,
        url,
        body: e.message,
      })
      logger.error(log)
      const store =
        textCommandAsyncStore.getStore() ||
        slashCommandAsyncStore.getStore() ||
        eventAsyncStore.getStore()
      let message = ""
      try {
        message = JSON.stringify({
          ...(store ? JSON.parse(store.data) : {}),
          error: log,
          stack: TEST ? "" : stack.clean(e.stack || new Error().stack || ""),
        })
      } catch (e) {
        message = JSON.stringify({
          error: "Error while trying to serialize/deserialize data",
        })
      }

      Sentry.captureMessage(`${PRODUCT_NAME}: API_CALL_ERROR ⎯ ${log}`, "fatal")
      await kafkaQueue?.produceAnalyticMsg([message])
      if (store?.msgOrInteraction && !isWebhook) {
        if (store.msgOrInteraction instanceof Message) {
          await store.msgOrInteraction.reply(somethingWentWrongPayload())
        } else if (!store.msgOrInteraction.isAutocomplete()) {
          await store.msgOrInteraction.editReply(somethingWentWrongPayload())
        }
      }
      return {
        ok: false,
        data: null,
        error: `Our team is fixing the issue. Stay tuned ${nekoSad}.`,
        log,
        curl,
        originalError: e?.message,
      }
    }
  }
}
