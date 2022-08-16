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

type OkResponse<T = Record<string, unknown>> = {
  json: () => Promise<{ data: Record<string, unknown> & T; error: null }>
}

type ErrResponse = {
  json: () => Promise<{ data: null; error: string }>
}

const defaultInit: RequestInit = {
  autoWrap500Error: true,
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
}

export class Fetcher {
  protected async jsonFetch<T>(url: string, init?: RequestInit) {
    const mergedInit = deepmerge(defaultInit, init)
    const { autoWrap500Error, ...validInit } = mergedInit
    const res = await fetch(url, validInit)

    let json
    if (!res.ok) {
      logger.error(
        `[API failed - ${res.status}]: ${url} with params ${validInit.body}`
      )

      json = await (res as ErrResponse).json()
      if (autoWrap500Error) {
        json.error =
          "Something went wrong, out team is notified and is working on the fix, stay tuned."
      } else {
        json.error = `${json.error[0].toUpperCase}${json.error.slice(1)}`
      }
    } else {
      logger.info(
        `[API ok - ${res.status}]: ${url} with params ${validInit.body}`
      )
      json = await (res as OkResponse<T>).json()
    }

    return json
  }
}
