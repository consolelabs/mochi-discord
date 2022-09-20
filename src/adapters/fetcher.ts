import deepmerge from "deepmerge"
import { logger } from "logger"
import type { RequestInit as NativeRequestInit } from "node-fetch"
import fetch from "node-fetch"
import { capFirst } from "utils/common"
import querystring from "query-string"
import { Pagination } from "types/common"
import { convertToSnakeCase } from "./fetcher-utils"
import toCurl from "fetch-to-curl"

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
}

type Payload = {
  log: string
  curl: string
}

type OkPayload = {
  ok: true
  data: Record<string, any>
  error: null
  pagination?: Pagination
} & Payload

type ErrPayload = {
  ok: false
  data: null
  error: string
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
}

export class Fetcher {
  protected async jsonFetch<T>(
    url: string,
    init: RequestInit = {}
  ): Promise<(OkPayload & T) | ErrPayload> {
    let curl = "None"
    try {
      const mergedInit = deepmerge(defaultInit, init)
      const {
        autoWrap500Error,
        query: _query,
        queryCamelToSnake,
        bodyCamelToSnake,
        body: _body,
        ...validInit
      } = mergedInit
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

        const json = await (res as ErrResponse).json()
        if (autoWrap500Error && res.status === 500) {
          json.error =
            "There was an error. Our team has been informed and is trying to fix the issue. Stay tuned."
        } else {
          json.error = capFirst(json.error)
        }
        json.ok = false
        json.log = log
        json.curl = curl
        return json
      } else {
        logger.info(log)
        const json = await (res as OkResponse<T>).json()
        json.ok = true
        json.log = log
        json.curl = curl
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
      return {
        ok: false,
        data: null,
        error:
          "There was an error. Our team has been informed and is trying to fix the issue. Stay tuned.",
        log,
        curl,
      }
    }
  }
}
