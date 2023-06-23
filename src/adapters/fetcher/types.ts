import type { RequestInit as NativeRequestInit } from "node-fetch"
import { Pagination } from "types/common"

type SerializableValue = string | number | boolean | undefined | null

export type RequestInit = Omit<NativeRequestInit, "body"> & {
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

export type OkPayload = {
  ok: true
  data: Record<string, any>
  result?: any
  error: null
  originalError?: string
  pagination?: Pagination
  // cache: {
  //   cachedAt: number
  //   status: "fresh" | "stale" | "expired" | "miss"
  // }
} & Payload

export type ErrPayload = {
  ok: false
  data: null
  result?: null
  error: string
  originalError?: string
  pagination?: Pagination
} & Payload

export type OkResponse<T> = {
  json: () => Promise<OkPayload & T>
}

export type ErrResponse = {
  json: () => Promise<ErrPayload>
}

export type FetchResult<T> = Promise<(OkPayload & T) | ErrPayload>
