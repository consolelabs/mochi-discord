import { snakeCase } from "change-case"

function isObject(v: any): v is object {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

export function convertToSnakeCase<T extends Record<string | number, any>>(
  obj: T
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
