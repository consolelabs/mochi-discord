import config from "adapters/config"
import {
  classifyTipSyntaxTargets,
  parseMonikerinCmd,
  parseTipAmount,
  parseMessageTip,
  parseMoniker,
} from "./tip-bot"
import mockdc from "../../tests/mocks/discord"
import { Message } from "discord.js"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { APIError } from "errors"
jest.mock("adapters/config")

describe("parseMonikerinCmd", () => {
  test("parse successful", async () => {
    const args = ["tip", "@user", "2", "coffee"]
    const expected = {
      newArgs: ["tip", "@user", "2", "ftm"],
      moniker: {
        value: 0.4,
        moniker: {
          amount: 1,
          moniker: "coffee",
          plural: "coffee",
          token: { token_symbol: "ftm" },
        },
      },
    }
    const monikerRes = {
      ok: true,
      error: null,
      data: [
        {
          value: 0.4,
          moniker: {
            amount: 1,
            moniker: "coffee",
            plural: "coffee",
            token: {
              token_symbol: "ftm",
            },
          },
        },
      ],
    }
    config.getMonikerConfig = jest.fn().mockResolvedValueOnce(monikerRes)
    const output = await parseMonikerinCmd(args, "guild_id")
    expect(output).toEqual(expected)
  })
  test("parse no moniker", async () => {
    const args = ["tip", "@user", "2", "ftm"]
    const expected = {
      newArgs: ["tip", "@user", "2", "ftm"],
      moniker: undefined,
    }
    const monikerRes = {
      ok: true,
      error: null,
      data: [
        {
          value: 0.4,
          moniker: {
            amount: 1,
            moniker: "coffee",
            plural: "coffee",
            token: {
              token_symbol: "ftm",
            },
          },
        },
      ],
    }
    config.getMonikerConfig = jest.fn().mockResolvedValueOnce(monikerRes)
    const output = await parseMonikerinCmd(args, "guild_id")
    expect(output).toEqual(expected)
  })
  test("parse wrong moniker", async () => {
    const args = ["tip", "@user", "2", "tea"]
    const expected = {
      newArgs: ["tip", "@user", "2", "tea"], //not moniker so keep symbol
      moniker: undefined,
    }
    const monikerRes = {
      ok: true,
      error: null,
      data: [
        {
          value: 0.4,
          moniker: {
            amount: 1,
            moniker: "coffee",
            plural: "coffee",
            token: {
              token_symbol: "ftm",
            },
          },
        },
      ],
    }
    config.getMonikerConfig = jest.fn().mockResolvedValueOnce(monikerRes)
    const output = await parseMonikerinCmd(args, "guild_id")
    expect(output).toEqual(expected)
  })
})

// classifyTipSyntaxTargets - check list of discord ids are all valid
test.each([
  [
    "<@333116155826929671>",
    { targets: ["<@333116155826929671>"], isValid: true },
  ],
  [
    "<@333116155826929671> <@333116155826929672> <@333116155826929673>",
    {
      targets: [
        "<@333116155826929671>",
        "<@333116155826929672>",
        "<@333116155826929673>",
      ],
      isValid: true,
    },
  ],
  // tip channel
  [
    "<#333116155826929671>",
    { targets: ["<#333116155826929671>"], isValid: true },
  ],
  // tip role
  [
    "<@&1022071198651269150>",
    { targets: ["<@&1022071198651269150>"], isValid: true },
  ],
  // invalid id
  ["<:asd:642702608393568256>", { targets: [], isValid: false }],
])("defi.classifyTipSyntaxTargets(%o)", (input, output) => {
  expect(classifyTipSyntaxTargets(input)).toStrictEqual(output)
})

describe("parseTipAmount", () => {
  let msg: Message

  beforeEach(() => (msg = mockdc.cloneMessage()))
  afterEach(() => jest.clearAllMocks())

  test("Negative - negative amount", () => {
    expect(() => parseTipAmount(msg, "-1")).toThrow(
      new DiscordWalletTransferError({
        discordId: msg.author.id,
        message: msg,
        error: "The amount is invalid. Please insert a positive number.",
        title: "Invalid amount",
      }),
    )
  })

  test("Negative - zero amount", () => {
    expect(() => parseTipAmount(msg, "0")).toThrow(
      new DiscordWalletTransferError({
        discordId: msg.author.id,
        message: msg,
        error: "The amount is invalid. Please insert a positive number.",
        title: "Invalid amount",
      }),
    )
  })

  test("Negative - non-numeric amount", () => {
    expect(() => parseTipAmount(msg, "x!")).toThrow(
      new DiscordWalletTransferError({
        discordId: msg.author.id,
        message: msg,
        error: "The amount is invalid. Please insert a positive number.",
        title: "Invalid amount",
      }),
    )
  })

  test("Positive - valid amount", () => {
    const expected = {
      all: false,
      amount: 1,
    }
    const output = parseTipAmount(msg, "1")
    expect(output).toStrictEqual(expected)
  })

  test("Positive - a / an amount", () => {
    const expected = {
      all: false,
      amount: 1,
    }
    const firstOutput = parseTipAmount(msg, "a")
    const secondOutput = parseTipAmount(msg, "an")
    expect(firstOutput).toStrictEqual(expected)
    expect(secondOutput).toStrictEqual(expected)
  })

  test("Positive - tip all", () => {
    const expected = {
      all: true,
      amount: 0,
    }
    const output = parseTipAmount(msg, "all")
    expect(output).toStrictEqual(expected)
  })
})

describe("parseMessageTip", () => {
  test("valid message with no quotes", () => {
    const args = ["tip", "haongo", "1", "ftm", "a test message"]
    const output = parseMessageTip(args, 4)
    expect(output).toEqual("a test message")
  })

  test("valid message with single quotes", () => {
    const args = ["tip", "haongo", "1", "ftm", "'a test message'"]
    const output = parseMessageTip(args, 4)
    expect(output).toEqual("a test message")
  })

  test("valid message with double quotes", () => {
    const args = ["tip", "haongo", "1", "ftm", `"a test message"`]
    const output = parseMessageTip(args, 4)
    expect(output).toEqual("a test message")
  })

  test("valid message with space between", () => {
    const args = ["tip", "haongo", "1", "ftm", "a", "test", "message"]
    const output = parseMessageTip(args, 4)
    expect(output).toEqual("a test message")
  })
})

describe("parseMoniker", () => {
  test("Negative - API error", async () => {
    const input = {
      unit: "coffee",
      guildId: "test",
    }
    const apiRes = {
      ok: false,
      curl: "test",
      log: "test",
      data: [],
      error: "",
      status: 500,
    }
    config.getMonikerConfig = jest.fn().mockResolvedValueOnce(apiRes)
    await expect(parseMoniker(input.unit, input.guildId)).rejects.toThrow(
      new APIError({
        description: apiRes.log,
        curl: apiRes.curl,
        status: apiRes.status,
      }),
    )
  })

  test("Positive - Moniker found", async () => {
    const input = {
      unit: "coffee",
      guildId: "test",
    }
    const monikerRes = {
      ok: true,
      error: null,
      data: [
        {
          value: 0.4,
          moniker: {
            amount: 1,
            moniker: "coffee",
            plural: "coffee",
            token: {
              token_symbol: "ftm",
            },
          },
        },
      ],
    }
    const expected = {
      value: 0.4,
      moniker: {
        amount: 1,
        moniker: "coffee",
        plural: "coffee",
        token: {
          token_symbol: "ftm",
        },
      },
    }
    config.getMonikerConfig = jest.fn().mockResolvedValueOnce(monikerRes)
    const output = await parseMoniker(input.unit, input.guildId)
    expect(output).toStrictEqual(expected)
    expect(config.getDefaultMoniker).toHaveBeenCalledTimes(0)
  })

  test("Positive - Moniker not found -> use guild default moniker", async () => {
    const input = {
      unit: "coffee",
      guildId: "test",
    }
    const monikerRes = {
      ok: true,
      error: null,
      data: [],
    }
    const defaultMonikerRes = {
      ok: true,
      error: null,
      data: [
        {
          value: 0.4,
          moniker: {
            amount: 1,
            moniker: "coffee",
            plural: "coffee",
            token: {
              token_symbol: "ftm",
            },
          },
        },
      ],
    }
    const expected = {
      value: 0.4,
      moniker: {
        amount: 1,
        moniker: "coffee",
        plural: "coffee",
        token: {
          token_symbol: "ftm",
        },
      },
    }
    config.getMonikerConfig = jest.fn().mockResolvedValueOnce(monikerRes)
    config.getDefaultMoniker = jest
      .fn()
      .mockResolvedValueOnce(defaultMonikerRes)
    const output = await parseMoniker(input.unit, input.guildId)
    expect(output).toStrictEqual(expected)
    expect(config.getDefaultMoniker).toHaveBeenCalledTimes(1)
  })
})
