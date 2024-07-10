import { snakeCase } from "change-case"
import { MOCHI_API_KEY } from "env"
import { MOCHI_PAY_API_BASE_URL } from "utils/constants"

function isObject(v: any): v is object {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

export function makeLog({
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
  status?: string | number
  method?: string
  body?: string
}) {
  if (notSent)
    return `[API failed ${
      method ?? "GET"
    }/request_not_sent]: ${url} with body ${body}`
  return `[API ${
    ok ? "ok" : "failed"
  } - ${method}/${status}]: ${url} with body ${body}`
}

export function attachAuthorization(url: string, options: any) {
  // only attach token for mochi-pay's request atm
  if (
    url.startsWith(MOCHI_PAY_API_BASE_URL) &&
    !options.headers["Authorization"]
  ) {
    options.headers = {
      ...options.headers,
      Authorization: `Basic ${MOCHI_API_KEY}`,
    }
  }
}

export function convertToSnakeCase<T extends Record<string | number, any>>(
  obj: T,
): T {
  const converted: Record<string | number, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (isObject(value)) {
      converted[snakeCase(key)] = convertToSnakeCase(value)
    } else if (Array.isArray(value)) {
      converted[snakeCase(key)] = value.map((v) => {
        if (isObject(v)) {
          return convertToSnakeCase(v)
        }
        return v
      })
    } else {
      converted[snakeCase(key)] = value
    }
  }

  return converted as T
}
