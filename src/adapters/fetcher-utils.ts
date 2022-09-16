import { snakeCase } from "change-case"

export function convertToSnakeCase<T extends Record<string | number, any>>(
  obj: T
): T {
  const converted: Record<string | number, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const isObject = typeof value === "object" && value !== null
    if (isObject) {
      converted[snakeCase(key)] = convertToSnakeCase(value)
    } else {
      converted[snakeCase(key)] = value
    }
  }

  return converted as T
}
