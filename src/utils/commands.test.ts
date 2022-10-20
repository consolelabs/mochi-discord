import { parseDiscordToken } from "./commands"

test.each<
  [string, Exclude<keyof ReturnType<typeof parseDiscordToken>, "value">, string]
>([
  // valid cases
  ["<:a:123>", "isEmoji", "123"],
  ["<a:animated_emoji:1299178283>", "isAnimatedEmoji", "1299178283"],
  ["🍎", "isNativeEmoji", "🍎"],
  ["<@91827>", "isUser", "91827"],
  ["<@&91827908>", "isRole", "91827908"],
  ["<#456321>", "isChannel", "456321"],
  ["671526", "isId", "671526"],
  [
    "0x6497b5580A58f2B890B3AD66bC459341312AcC23",
    "isAddress",
    "0x6497b5580A58f2B890B3AD66bC459341312AcC23",
  ],
  // invalid cases
  ["", "isUnknown", ""],
  ["asdb", "isUnknown", ""],
  ["<>", "isUnknown", ""],
  ["<w>", "isUnknown", ""],
  ["<:w>", "isUnknown", ""],
  ["<@wqwe>", "isUnknown", ""],
  ["<:_:1", "isUnknown", ""],
  ["<#:_:1", "isUnknown", ""],
  // invalid with prefix/suffix
  ["error<#123>", "isUnknown", ""],
  ["<#123>thiswillfail", "isUnknown", ""],
  ["notgonnawork🍐", "isUnknown", ""],
])(
  "parseDiscordToken(%s), %s = true, value is '%s'",
  (input, expectedType, expectedValue) => {
    const result = parseDiscordToken(input)
    expect(result[expectedType]).toBeTruthy()
    expect(result.value).toBe(expectedValue)
  }
)
