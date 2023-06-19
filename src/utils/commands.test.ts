import { commands } from "commands"
import { mockMessage } from "../../tests/mocks"
import {
  getActionCommand,
  getCommandMetadata,
  getCommandObject,
  isAcceptableCmdToHelp,
  parseDiscordToken,
} from "./commands"

// parseDiscordToken
test.each<
  [string, Exclude<keyof ReturnType<typeof parseDiscordToken>, "value">, string]
>([
  // valid cases
  ["<:a:123>", "isEmoji", "123"],
  ["<a:animated_emoji:1299178283>", "isAnimatedEmoji", "1299178283"],
  ["🍎", "isNativeEmoji", "🍎"],
  ["<@91827>", "isUser", "91827"],
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
  ["<@a91827>", "isUnknown", ""],
  ["<:_:1", "isUnknown", ""],
  ["<#:_:1", "isUnknown", ""],
  // invalid with prefix/suffix
  ["error<#123>", "isUnknown", ""],
  ["<#123>thiswillfail", "isUnknown", ""],
  ["notgonnawork🍐", "isUnknown", ""],
  ["ehh<@91827>", "isUnknown", ""],
])(
  "parseDiscordToken(%s), %s = true, value is '%s'",
  (input, expectedType, expectedValue) => {
    const result = parseDiscordToken(input)
    expect(result[expectedType]).toBeTruthy()
    expect(result.value).toBe(expectedValue)
  }
)

// isAcceptableCmdToHelp
test.each([
  // $help
  [
    {
      cmd: "help",
      aliases: [],
      action: "",
      msg: "$help",
    },
    true,
  ],
  // $gm
  [
    {
      cmd: "gm",
      aliases: ["gn"],
      action: "",
      msg: "$gm",
    },
    true,
  ],
])("isAcceptableCmdToHelp(%o)", (input, output) => {
  expect(
    isAcceptableCmdToHelp(input.cmd, input.aliases, input.action, input.msg)
  ).toStrictEqual(output)
})

// getCommandMetadata
test.each([
  // $help
  [
    "$help",
    {
      commandKey: "help",
      action: undefined,
      isSpecificHelpCommand: false,
    },
  ],
  [
    "$help ticker",
    {
      commandKey: "ticker",
      action: undefined,
      isSpecificHelpCommand: true,
    },
  ],
  [
    "$ticker help",
    {
      commandKey: "ticker",
      action: undefined,
      isSpecificHelpCommand: true,
    },
  ],
  // $tip
  [
    "$tip @krafe 1 ftm",
    {
      commandKey: "tip",
      action: undefined,
      isSpecificHelpCommand: false,
    },
  ],
  // $nft
  [
    "$nft rabby 1",
    {
      commandKey: "nft",
      action: undefined,
      isSpecificHelpCommand: false,
    },
  ],
  [
    "$nft add 0x51081a152db09d3FfF75807329A3A8b538eCf73b ftm",
    {
      commandKey: "nft",
      action: "add",
      isSpecificHelpCommand: false,
    },
  ],
])("getCommandMetadata(%s)", (input, output) => {
  mockMessage.content = input
  expect(getCommandMetadata(commands, mockMessage)).toStrictEqual(output)
})

// getCommandObject
test.each([
  ["$asd", undefined],
  ["$help", commands["help"]],
  ["$help tip", commands["tip"]],
  ["$nft neko 123", commands["nft"]],
  ["$nft add", commands["nft"]],
  ["$nr set", commands["nr"]],
])("getCommandObject(%s)", (input, output) => {
  mockMessage.content = input
  expect(getCommandObject(commands, mockMessage)).toStrictEqual(output)
})

// getActionCommand
test.each([
  // $case no action
  ["$help", null],
  ["$help tickerr", null],
  ["$help tip", null],
  ["$ticker ftm", null],
  ["$nft neko 123", null],
  // case with action
  ["$nft add", commands["nft"].actions?.["add"]],
])("getActionCommand(%s)", (input, output) => {
  mockMessage.content = input
  expect(getActionCommand(commands, mockMessage)).toStrictEqual(output)
})
