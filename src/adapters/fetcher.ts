import deepmerge from "deepmerge"
import { logger } from "logger"
import type { RequestInit as NativeRequestInit } from "node-fetch"
import fetch from "node-fetch"

type RequestInit = NativeRequestInit & {
  /**
   * Whether to hide the 500 error with some generic message e.g "Something went wrong"
   * */
  autoWrap500Error?: boolean
}

type OkPayload<T> = {
  ok: true
  data: Record<string, any> & T
  suggestions?: Array<{
    name: string
    symbol: string
    address: string
    chain: string
  }>
  error: null
}

type ErrPayload = {
  ok: false
  data: null
  error: string
}

type OkResponse<T = Record<string, any>> = {
  json: () => Promise<OkPayload<T>>
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
}

export class Fetcher {
  protected async jsonFetch<T>(
    url: string,
    init: RequestInit = {}
  ): Promise<OkPayload<T> | ErrPayload> {
    try {
      const mergedInit = deepmerge(defaultInit, init)
      const { autoWrap500Error, ...validInit } = mergedInit
      const res = await fetch(url, validInit)

      if (!res.ok) {
        logger.error(
          `[API failed - ${res.status}]: ${url} with params ${validInit.body}`
        )

        const json = await (res as ErrResponse).json()
        if (autoWrap500Error) {
          json.error =
            "Something went wrong, out team is notified and is working on the fix, stay tuned."
        } else {
          json.error = `${json.error[0].toUpperCase}${json.error.slice(1)}`
        }
        json.ok = false
        return json
      } else {
        logger.info(
          `[API ok - ${res.status}]: ${url} with params ${
            validInit.body ?? "{}"
          }`
        )
        const json = await (res as OkResponse<T>).json()
        json.ok = true
        return json
      }
    } catch (e: any) {
      logger.error(`[API failed]: ${e.message}`)
      return {
        ok: false,
        data: null,
        error:
          "Something went wrong, out team is notified and is working on the fix, stay tuned.",
      }
    }
  }
}
