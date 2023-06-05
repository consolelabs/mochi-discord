import deepmerge from "deepmerge"
import { logger } from "logger"
import type { RequestInit as NativeRequestInit } from "node-fetch"
import fetch from "node-fetch"
import { capFirst, getEmoji } from "utils/common"
import querystring from "query-string"
import { Pagination } from "types/common"
import { convertToSnakeCase } from "./fetcher-utils"
import toCurl from "fetch-to-curl"
import { kafkaQueue } from "queue/kafka/queue"
import { stack } from "utils/stack-trace"
import { MOCHI_API_KEY, TEST } from "env"
import {
  eventAsyncStore,
  slashCommandAsyncStore,
  textCommandAsyncStore,
} from "utils/async-storages"
import { Message } from "discord.js"
import { somethingWentWrongPayload } from "utils/error"
import { MOCHI_PAY_API_BASE_URL } from "../utils/constants"

function makeLog({
  query,
  ok,
  notSent = false,
  body = "",
  url,
  status,
  method = "GET",
}: {
  url: string
  ok: boolean
  notSent?: boolean
  status: number
  method?: string
  body?: string
  query: string
}) {
  if (notSent)
    return `[API failed ${method ?? "GET"}/request_not_sent]: ${body}`
  return `[API ${
    ok ? "ok" : "failed"
  } - ${method}/${status}]: ${url} with body ${body}, query ${query}`
}

type SerializableValue = string | number | boolean | undefined | null

type RequestInit = Omit<NativeRequestInit, "body"> & {
  /**
   * Whether to hide the 500 error with some generic message e.g "Something went wrong"
   * */
  autoWrap500Error?: boolean
  /**
   * Query string values, support array format
   *   Default to empty object
   * */
  query?: Record<string, SerializableValue | Array<SerializableValue>>
  /**
   *   For querystring
   * Toggle auto convert camelCase to snake_case when sending request e.g `guildId` will turn into `guild_id`
   * Default to true
   * */
  queryCamelToSnake?: boolean
  /**
   * For body payload (POST requests)
   * Toggle auto convert camelCase to snake_case when sending request e.g `guildId` will turn into `guild_id`
   * Default to true
   * */
  bodyCamelToSnake?: boolean
  /**
   * The body payload
   * */
  body?: string | Record<string, any>
  /**
   * Only log when there is an error
   * */
  silent?: boolean
  /**
   * Used ONLY for webhook APIs
   * */
  isWebhook?: boolean
}

type Payload = {
  log: string
  curl: string
  status?: number
}

type OkPayload = {
  ok: true
  data: Record<string, any>
  error: null
  originalError?: string
  pagination?: Pagination
} & Payload

type ErrPayload = {
  ok: false
  data: null
  error: string
  originalError?: string
  pagination?: Pagination
} & Payload

type OkResponse<T> = {
  json: () => Promise<OkPayload & T>
}

type ErrResponse = {
  json: () => Promise<ErrPayload>
}

const defaultInit: RequestInit = {
  autoWrap500Error: true,
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

function attachAuthorization(url: string, options: any) {
  // only attach token for mochi-pay's request atm
  if (url.startsWith(MOCHI_PAY_API_BASE_URL)) {
    options.headers = {
      Authorization: `Basic ${MOCHI_API_KEY}`,
    }
  }
}

export class Fetcher {
  protected async jsonFetch<T>(
    url: string,
    init: RequestInit = {}
  ): Promise<(OkPayload & T) | ErrPayload> {
    let curl = "None"
    const nekoSad = getEmoji("NEKOSAD")
    let isWebhook = false
    try {
      const mergedInit = deepmerge(defaultInit, init)
      const {
        autoWrap500Error,
        query: _query,
        queryCamelToSnake,
        bodyCamelToSnake,
        body: _body,
        silent,
        isWebhook: _isWebhook,
        ...validInit
      } = mergedInit
      isWebhook = _isWebhook
      let query: typeof _query = {}

      if (queryCamelToSnake) {
        query = convertToSnakeCase(_query)
      } else {
        query = _query
      }

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

      const requestURL = querystring.stringifyUrl(
        { url, query },
        { arrayFormat: "separator", arrayFormatSeparator: "|" }
      )
      const options = {
        ...validInit,
        body,
      }
      attachAuthorization(url, options)
      curl = toCurl(requestURL, options)
      const res = await fetch(requestURL, options)

      const log = makeLog({
        ok: res.ok,
        method: init.method,
        status: res.status,
        url,
        body,
        query: querystring.stringify(query),
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
          await kafkaQueue?.produceAnalyticMsg([message])

          // if the error is from webhook api, we don't want to bother user with it, just kafka log is enough
          if (store?.msgOrInteraction && !isWebhook) {
            if (store.msgOrInteraction instanceof Message) {
              await store.msgOrInteraction.reply(somethingWentWrongPayload())
            } else if (!store.msgOrInteraction.isAutocomplete()) {
              await store.msgOrInteraction.editReply(
                somethingWentWrongPayload()
              )
            }
          }
        }

        const json = await (res as ErrResponse).json()
        json.originalError = json.error
        if (autoWrap500Error && res.status === 500) {
          json.error = `Our team is fixing the issue. Stay tuned ${nekoSad}.`
        } else {
          json.error = capFirst(json.error)
        }
        json.ok = false
        json.log = log
        json.curl = curl
        json.status = res.status
        return json
      } else {
        if (!silent) {
          logger.info(log)
        }
        const json = await (res as OkResponse<T>).json()
        json.ok = true
        json.log = log
        json.curl = curl
        json.status = res.status
        return json
      }
    } catch (e: any) {
      const log = makeLog({
        notSent: true,
        ok: false,
        method: init.method,
        status: 0,
        url,
        body: e.message,
        query: querystring.stringify({}),
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
